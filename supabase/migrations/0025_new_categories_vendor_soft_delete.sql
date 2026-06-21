-- 0025: Add new product categories + vendor soft-delete support

-- ═══ Task 1: Insert new categories ═══
INSERT INTO categories (id, slug, name, source, icon, emoji, items_count, highlight, sort_order)
VALUES
  ('cat-ready-food', 'gotovaya-eda', 'Готовая еда', 'food', 'utensils', '🍱', 0, true, 100),
  ('cat-chemistry', 'bytovaya-khimiya', 'Бытовая химия', 'market', 'spray', '🧴', 0, true, 101),
  ('cat-pharmacy', 'apteka', 'Аптека', 'market', 'pill', '💊', 0, true, 102)
ON CONFLICT (id) DO NOTHING;

-- ═══ Task 2: Vendor soft-delete ═══
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- Index for fast filtering of active vendors
CREATE INDEX IF NOT EXISTS idx_vendors_deleted_at ON vendors (deleted_at) WHERE deleted_at IS NULL;

-- Hide deleted vendors from buyer-facing queries (RLS-safe approach)
-- Update existing policies or add a view for buyer queries
CREATE OR REPLACE VIEW active_vendors AS
  SELECT * FROM vendors WHERE deleted_at IS NULL;

-- When a vendor is soft-deleted, hide their products from buyers
-- We mark products as unavailable rather than deleting them
ALTER TABLE products ADD COLUMN IF NOT EXISTS vendor_deleted boolean DEFAULT false;
