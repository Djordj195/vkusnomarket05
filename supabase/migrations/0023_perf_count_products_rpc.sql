-- Lightweight RPC to count products per category.
-- Replaces full SELECT * FROM products used in listCategories().
CREATE OR REPLACE FUNCTION count_products_by_category()
RETURNS TABLE(category_id TEXT, cnt BIGINT) AS $$
  SELECT p.category_id, COUNT(*) AS cnt
  FROM products p
  GROUP BY p.category_id;
$$ LANGUAGE sql STABLE;
