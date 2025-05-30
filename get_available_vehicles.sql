-- Vehicle search query for n8n workflow
-- Returns ALL available vehicles with pricing
-- Use parameters to filter results (null = no filter)

SELECT 
  v.id,
  v.make,
  v.model,
  v.year,
  v.category,
  v.transmission,
  v.fuel_type,
  v.seats,
  v.doors,
  v.license_plate,
  v.image_url,
  v.is_available,
  p.daily_rate as price_per_day,
  p.weekly_rate,
  p.monthly_rate,
  CONCAT(v.make, ' ', v.model, ' ', v.year) as vehicle_name
FROM vehicles v
LEFT JOIN pricing p ON v.id = p.vehicle_id
WHERE 
  v.is_available = true
  AND ($1::text IS NULL OR LOWER(v.make) = LOWER($1))
  AND ($2::text IS NULL OR LOWER(v.model) = LOWER($2))
  AND ($3::text IS NULL OR $3 = 'all' OR LOWER(v.category) = LOWER($3))
  AND ($4::integer IS NULL OR v.year = $4)
ORDER BY v.category, v.make, v.model, v.year;