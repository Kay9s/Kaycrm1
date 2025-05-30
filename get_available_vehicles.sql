-- Enhanced vehicle search query with flexible filtering
-- This query handles various search scenarios:
-- - Search by make only (e.g., "Toyota")
-- - Search by model only (e.g., "Camry") 
-- - Search by year only (e.g., "2024")
-- - Search by category only (e.g., "SUV")
-- - Combined searches (e.g., "Toyota Camry 2024")
-- - Partial matches and case-insensitive search

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
  v.features,
  v.license_plate,
  v.status,
  v.maintenance_status,
  v.image_url,
  v.is_available,
  v.current_booking_start_date,
  v.current_booking_end_date,
  v.current_booking_id,
  -- Pricing information from separate pricing table
  p.daily_rate,
  p.weekly_rate,
  p.monthly_rate,
  p.insurance_daily,
  p.seasonal_multiplier,
  -- Calculated fields for better user experience
  CONCAT(v.make, ' ', v.model, ' ', v.year) as vehicle_full_name,
  CASE 
    WHEN v.is_available = true THEN 'Available'
    WHEN v.current_booking_start_date IS NOT NULL THEN 'Booked until ' || v.current_booking_end_date
    ELSE 'Unavailable'
  END as availability_status
FROM vehicles v
LEFT JOIN pricing p ON v.id = p.vehicle_id
WHERE 
  v.is_available = true
  AND v.status = 'available'
  AND v.maintenance_status IN ('ok', 'good', 'excellent')
  
  -- Flexible make search (handles partial matches)
  AND (
    $1::text IS NULL 
    OR $1::text = '' 
    OR LOWER(v.make) LIKE LOWER('%' || $1 || '%')
  )
  
  -- Flexible model search (handles partial matches)  
  AND (
    $2::text IS NULL 
    OR $2::text = '' 
    OR LOWER(v.model) LIKE LOWER('%' || $2 || '%')
  )
  
  -- Category search (exact match but case-insensitive)
  AND (
    $3::text IS NULL 
    OR $3::text = '' 
    OR $3::text = 'all'
    OR LOWER(v.category) = LOWER($3)
  )
  
  -- Year range search (handles single year or range)
  AND (
    $4::integer IS NULL 
    OR v.year >= $4
  )
  
  AND (
    $5::integer IS NULL 
    OR v.year <= $5
  )
  
  -- Transmission filter
  AND (
    $6::text IS NULL 
    OR $6::text = '' 
    OR LOWER(v.transmission) = LOWER($6)
  )
  
  -- Fuel type filter
  AND (
    $7::text IS NULL 
    OR $7::text = '' 
    OR LOWER(v.fuel_type) = LOWER($7)
  )
  
  -- Minimum seats requirement
  AND (
    $8::integer IS NULL 
    OR v.seats >= $8
  )
  
  -- Exact doors requirement
  AND (
    $9::integer IS NULL 
    OR v.doors = $9
  )
  
  -- Features search (array contains check)
  AND (
    $10::text IS NULL 
    OR $10::text = '' 
    OR $10 = ANY(v.features)
  )

ORDER BY 
  v.category,
  v.make,
  v.model,
  v.year
LIMIT 50;

-- Parameter guide for n8n workflow:
-- $1: make (e.g., 'Toyota', 'Ford', null for any)
-- $2: model (e.g., 'Camry', 'F-150', null for any)  
-- $3: category (e.g., 'SUV', 'Sedan', 'all' or null for any)
-- $4: min_year (e.g., 2020, null for any)
-- $5: max_year (e.g., 2025, null for any)
-- $6: transmission (e.g., 'Automatic', 'Manual', null for any)
-- $7: fuel_type (e.g., 'Gasoline', 'Hybrid', 'Electric', null for any)
-- $8: min_seats (e.g., 5, 7, null for any)
-- $9: doors (e.g., 2, 4, null for any)
-- $10: required_feature (e.g., 'GPS Navigation', 'Bluetooth', null for any)

-- Example usage scenarios:
-- 1. Find all Toyotas: $1='Toyota', others null
-- 2. Find 2024 vehicles: $4=2024, $5=2024, others null  
-- 3. Find SUVs: $3='SUV', others null
-- 4. Find Toyota Camry 2024: $1='Toyota', $2='Camry', $4=2024, $5=2024
-- 5. Find vehicles with 7+ seats: $8=7, others null
-- 6. Find automatic SUVs: $3='SUV', $6='Automatic', others null