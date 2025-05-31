-- n8n Booking Creation Query - COPY THIS EXACT QUERY TO YOUR POSTGRESQL NODE
-- Replace your current query with this one

INSERT INTO bookings (
  customer_name,
  customer_phone,
  vehicle_make,
  vehicle_model,
  start_date,
  end_date,
  special_requests,
  booking_ref,
  status,
  source
) 
VALUES (
  $1,  -- customer_name (from {{ $json.full_name }})
  $2,  -- customer_phone (from {{ $json.phone }})
  $3,  -- vehicle_make (from {{ $json.vehicle_make }})
  $4,  -- vehicle_model (from {{ $json.vehicle_model }})
  $5,  -- start_date (from {{ $json.start_date }})
  $6,  -- end_date (from {{ $json.end_date }})
  $7,  -- special_requests (from {{ $json.special_requests }})
  $8,  -- booking_ref (from {{ $json.booking_id }})
  'confirmed',  -- status
  'n8n_voice'   -- source
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
  status;