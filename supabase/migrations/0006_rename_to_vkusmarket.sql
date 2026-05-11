-- Rename brand from "ВКУСНОМАРКЕТ" to "ВкусМаркет" in the seed vendor row.
-- Idempotent: safe to re-run. Only updates the canonical seed vendor by id
-- so it never touches vendors created via /vendor/signup or any other source.

UPDATE public.vendors
SET
  brand_name = 'ВкусМаркет Кизляр',
  description = REPLACE(
    description,
    'ВКУСНОМАРКЕТ',
    'ВкусМаркет'
  )
WHERE id = 'vnd-vkusnomarket-kizlyar';
