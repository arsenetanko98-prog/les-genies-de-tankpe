-- ============================================================
-- Les Génies de Tankpè — base de données (à coller dans Supabase > SQL Editor > Run)
-- AVANT de lancer : remplace l'adresse e-mail ci-dessous par celle du Directeur.
-- ============================================================

CREATE TABLE IF NOT EXISTS admins (email text PRIMARY KEY);
INSERT INTO admins (email) VALUES ('EMAIL_DU_DIRECTEUR@exemple.com') ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION est_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM admins WHERE lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));
$$;

CREATE TABLE IF NOT EXISTS classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  cycle text NOT NULL DEFAULT 'Primaire',
  ordre int NOT NULL DEFAULT 0,
  frais_annuels int NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS matieres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  classe_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  nom text NOT NULL,
  coef numeric NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS eleves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  matricule text UNIQUE NOT NULL,
  nom text NOT NULL,
  prenoms text NOT NULL DEFAULT '',
  sexe text NOT NULL DEFAULT 'M',
  date_naissance date,
  classe_id uuid REFERENCES classes(id) ON DELETE SET NULL,
  parent_nom text DEFAULT '',
  parent_tel text DEFAULT '',
  code_parent text NOT NULL DEFAULT upper(substr(md5(random()::text), 1, 6)),
  actif boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  eleve_id uuid NOT NULL REFERENCES eleves(id) ON DELETE CASCADE,
  matiere_id uuid NOT NULL REFERENCES matieres(id) ON DELETE CASCADE,
  periode text NOT NULL,
  devoir numeric CHECK (devoir IS NULL OR (devoir >= 0 AND devoir <= 20)),
  compo numeric CHECK (compo IS NULL OR (compo >= 0 AND compo <= 20)),
  UNIQUE (eleve_id, matiere_id, periode)
);

CREATE TABLE IF NOT EXISTS personnel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  role text NOT NULL DEFAULT 'Enseignant',
  matiere text DEFAULT '',
  telephone text DEFAULT '',
  actif boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS presences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jour date NOT NULL,
  cible text NOT NULL CHECK (cible IN ('eleve','personnel')),
  ref_id uuid NOT NULL,
  statut text NOT NULL CHECK (statut IN ('present','absent','retard')),
  UNIQUE (jour, cible, ref_id)
);

CREATE TABLE IF NOT EXISTS paiements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recu_no bigserial,
  eleve_id uuid NOT NULL REFERENCES eleves(id) ON DELETE CASCADE,
  montant int NOT NULL CHECK (montant > 0),
  motif text NOT NULL DEFAULT 'Scolarité',
  mode text NOT NULL DEFAULT 'Espèces',
  jour date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS annonces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titre text NOT NULL,
  texte text NOT NULL DEFAULT '',
  jour date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  telephone text NOT NULL,
  texte text NOT NULL,
  lu boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Sécurité : tout est réservé à l'administration, sauf lecture des annonces et envoi de message.
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['classes','matieres','eleves','notes','personnel','presences','paiements','annonces','messages','admins'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_admin', t);
    IF t <> 'admins' THEN
      EXECUTE format('CREATE POLICY %I ON %I FOR ALL TO authenticated USING (est_admin()) WITH CHECK (est_admin())', t || '_admin', t);
    END IF;
  END LOOP;
END $$;

DROP POLICY IF EXISTS annonces_lecture ON annonces;
CREATE POLICY annonces_lecture ON annonces FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS messages_envoi ON messages;
CREATE POLICY messages_envoi ON messages FOR INSERT TO anon, authenticated
  WITH CHECK (length(nom) BETWEEN 2 AND 100 AND length(telephone) BETWEEN 6 AND 30 AND length(texte) BETWEEN 2 AND 1500);

-- Espace parents : matricule + code secret donnés par l'école.
CREATE OR REPLACE FUNCTION parent_consulter(p_matricule text, p_code text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE e eleves; c classes; res jsonb;
BEGIN
  SELECT * INTO e FROM eleves WHERE upper(matricule) = upper(trim(p_matricule)) AND upper(code_parent) = upper(trim(p_code)) AND actif;
  IF NOT FOUND THEN RETURN NULL; END IF;
  SELECT * INTO c FROM classes WHERE id = e.classe_id;
  res := jsonb_build_object(
    'eleve', jsonb_build_object('nom', e.nom, 'prenoms', e.prenoms, 'matricule', e.matricule, 'sexe', e.sexe),
    'classe', CASE WHEN c.id IS NULL THEN NULL ELSE jsonb_build_object('nom', c.nom, 'cycle', c.cycle, 'frais', c.frais_annuels) END,
    'matieres', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', m.id, 'nom', m.nom, 'coef', m.coef) ORDER BY m.nom) FROM matieres m WHERE m.classe_id = e.classe_id), '[]'::jsonb),
    'notes', COALESCE((SELECT jsonb_agg(jsonb_build_object('matiere_id', n.matiere_id, 'periode', n.periode, 'devoir', n.devoir, 'compo', n.compo)) FROM notes n WHERE n.eleve_id = e.id), '[]'::jsonb),
    'paiements', COALESCE((SELECT jsonb_agg(jsonb_build_object('recu_no', p.recu_no, 'montant', p.montant, 'motif', p.motif, 'mode', p.mode, 'jour', p.jour) ORDER BY p.jour DESC, p.recu_no DESC) FROM paiements p WHERE p.eleve_id = e.id), '[]'::jsonb),
    'presences', COALESCE((SELECT jsonb_build_object('present', count(*) FILTER (WHERE statut='present'), 'absent', count(*) FILTER (WHERE statut='absent'), 'retard', count(*) FILTER (WHERE statut='retard')) FROM presences WHERE cible='eleve' AND ref_id = e.id), '{}'::jsonb),
    'dernieres_absences', COALESCE((SELECT jsonb_agg(jour ORDER BY jour DESC) FROM (SELECT jour FROM presences WHERE cible='eleve' AND ref_id = e.id AND statut='absent' ORDER BY jour DESC LIMIT 10) z), '[]'::jsonb)
  );
  RETURN res;
END $$;
GRANT EXECUTE ON FUNCTION parent_consulter(text, text) TO anon, authenticated;

-- Classes de départ (modifiables ensuite dans l'espace Direction)
INSERT INTO classes (nom, cycle, ordre)
SELECT v.nom, v.cycle, v.ordre FROM (VALUES
  ('Maternelle 1','Maternelle',1),('Maternelle 2','Maternelle',2),
  ('CI','Primaire',10),('CP','Primaire',11),('CE1','Primaire',12),('CE2','Primaire',13),('CM1','Primaire',14),('CM2','Primaire',15),
  ('6ème','Secondaire',20),('5ème','Secondaire',21),('4ème','Secondaire',22),('3ème','Secondaire',23),
  ('2nde','Secondaire',24),('1ère','Secondaire',25),('Terminale','Secondaire',26)
) AS v(nom, cycle, ordre) WHERE NOT EXISTS (SELECT 1 FROM classes);
