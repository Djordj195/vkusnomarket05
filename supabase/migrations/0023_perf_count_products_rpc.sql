-- Lightweight RPC to count buyer-visible products per category.
-- Only counts products that are in_stock and not vendor-deleted.
CREATE OR REPLACE FUNCTION count_products_by_category()
RETURNS TABLE(category_id TEXT, cnt BIGINT) AS $$
  SELECT p.category_id, COUNT(*) AS cnt
  FROM products p
  WHERE p.in_stock = true
    AND (p.vendor_deleted IS NULL OR p.vendor_deleted = false)
  GROUP BY p.category_id;
$$ LANGUAGE sql STABLE;
