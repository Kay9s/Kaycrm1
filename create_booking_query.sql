-- n8n Booking Creation Query
-- Use this in your PostgreSQL node for creating bookings

INSERT INTO bookings (
  customer_name,
  customer_phone,
  customer_email,
  vehicle_make,
  vehicle_model,
  start_date,
  end_date,
  special_requests,
  booking_ref,
  status,
  source,
  customer_id,
  vehicle_id,
  created_at
) 
VALUES (
  $1,  -- customer_name
  $2,  -- customer_phone
  $3,  -- customer_email
  $4,  -- vehicle_make
  $5,  -- vehicle_model
  $6,  -- start_date
  $7,  -- end_date
  $8,  -- special_requests
  $9,  -- booking_ref
  'confirmed',  -- status
  'n8n_voice',  -- source
  1,   -- customer_id (default)
  1,   -- vehicle_id (default)
  NOW()  -- created_at
)
RETURNING 
  id,
  booking_ref,
  customer_name,
  customer_phone,
  vehicle_make,
  vehicle_model,
  start_date,
  end_date,
  status,
  created_at;