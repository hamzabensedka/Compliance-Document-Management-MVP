-- Seed default document categories
INSERT INTO document_categories (name, description, is_required) VALUES
  ('Fire Safety Certificate', 'Fire safety compliance documentation', true),
  ('Health Certificate', 'Health and safety compliance certificate', true),
  ('Insurance Policy', 'Insurance coverage documentation', true),
  ('Building Permit', 'Building permit and renewal documents', true),
  ('Electrical Inspection', 'Electrical safety inspection certificate', true),
  ('Environmental Compliance', 'Environmental compliance documentation', false),
  ('Tax Documents', 'Tax-related compliance documents', false),
  ('Licenses', 'Business and operational licenses', false)
ON CONFLICT (name) DO NOTHING;

