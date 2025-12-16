-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Admins can view all organizations" ON organizations;
DROP POLICY IF EXISTS "Org admins can view their organization" ON organizations;
DROP POLICY IF EXISTS "Admins can view all sites" ON sites;
DROP POLICY IF EXISTS "Org admins can view sites in their org" ON sites;
DROP POLICY IF EXISTS "Site managers can view their assigned sites" ON sites;
DROP POLICY IF EXISTS "Admins can view all documents" ON documents;
DROP POLICY IF EXISTS "Org admins can view documents in their org" ON documents;
DROP POLICY IF EXISTS "Site managers can view documents for their sites" ON documents;
DROP POLICY IF EXISTS "Site managers can upload documents to their sites" ON documents;
DROP POLICY IF EXISTS "Site managers can update documents for their sites" ON documents;
DROP POLICY IF EXISTS "Site managers can delete documents for their sites" ON documents;
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can view document categories" ON document_categories;
DROP POLICY IF EXISTS "Users can view their own audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Admins can view all audit logs" ON audit_logs;

-- RLS Policies for Organizations
CREATE POLICY "Admins can view all organizations"
  ON organizations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Org admins can view their organization"
  ON organizations FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT organization_id FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'org_admin'
    )
  );

-- RLS Policies for Sites
CREATE POLICY "Admins can view all sites"
  ON sites FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Org admins can view sites in their org"
  ON sites FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'org_admin'
    )
  );

CREATE POLICY "Site managers can view their assigned sites"
  ON sites FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT site_id FROM site_managers
      WHERE site_managers.user_id = auth.uid()
    )
  );

-- RLS Policies for Documents
CREATE POLICY "Admins can view all documents"
  ON documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Org admins can view documents in their org"
  ON documents FOR SELECT
  TO authenticated
  USING (
    site_id IN (
      SELECT sites.id FROM sites
      INNER JOIN user_profiles ON sites.organization_id = user_profiles.organization_id
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'org_admin'
    )
  );

CREATE POLICY "Site managers can view documents for their sites"
  ON documents FOR SELECT
  TO authenticated
  USING (
    site_id IN (
      SELECT site_id FROM site_managers
      WHERE site_managers.user_id = auth.uid()
    )
  );

CREATE POLICY "Site managers can upload documents to their sites"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (
    site_id IN (
      SELECT site_id FROM site_managers
      WHERE site_managers.user_id = auth.uid()
    )
  );

CREATE POLICY "Site managers can update documents for their sites"
  ON documents FOR UPDATE
  TO authenticated
  USING (
    site_id IN (
      SELECT site_id FROM site_managers
      WHERE site_managers.user_id = auth.uid()
    )
  );

CREATE POLICY "Site managers can delete documents for their sites"
  ON documents FOR DELETE
  TO authenticated
  USING (
    site_id IN (
      SELECT site_id FROM site_managers
      WHERE site_managers.user_id = auth.uid()
    )
  );

-- RLS Policies for User Profiles
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.role = 'admin'
    )
  );

-- RLS Policies for Document Categories (public read for authenticated users)
CREATE POLICY "Users can view document categories"
  ON document_categories FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for Audit Logs
CREATE POLICY "Users can view their own audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

