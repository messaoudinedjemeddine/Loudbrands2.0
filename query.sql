SELECT p.name, p.slug, p."isActive", p.stock, b.slug as brand_slug, c.slug as category_slug 
FROM products p 
JOIN brands b ON p."brandId" = b.id 
JOIN categories c ON p."categoryId" = c.id 
WHERE p.name ILIKE '%caftan%' OR p.name ILIKE '%djawhara%';
