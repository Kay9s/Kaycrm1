// n8n Code Node for Booking Creation
// This processes booking data and prepares it for database insertion

// Get input data from previous node
const inputData = $input.all();
const bookingData = inputData[0].json;

console.log("Booking input:", JSON.stringify(bookingData, null, 2));

// Generate booking reference
function generateBookingRef() {
  const prefix = 'BK';
  const randomNum = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}-${randomNum}`;
}

// Format date to YYYY-MM-DD
function formatDate(dateStr) {
  if (!dateStr) return null;
  
  try {
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0];
  } catch (error) {
    return dateStr; // Return as-is if parsing fails
  }
}

let result = {
  success: false,
  sqlQuery: '',
  parameters: [],
  bookingRef: '',
  message: ''
};

try {
  // Check if we have booking request
  if (bookingData.requestType === "booking" && bookingData.bookingData) {
    const booking = bookingData.bookingData;
    
    // Generate booking reference
    const bookingRef = generateBookingRef();
    
    // Prepare SQL query
    result.sqlQuery = `
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
        $1, $2, $3, $4, $5, $6, $7, $8, $9, 
        'confirmed', 'n8n_voice', 1, 1, NOW()
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
        created_at
    `;
    
    // Prepare parameters
    result.parameters = [
      booking.customer_name || 'Unknown Customer',
      booking.phone || '',
      booking.email || '',
      booking.vehicle_make || '',
      booking.vehicle_model || '',
      formatDate(booking.start_date),
      formatDate(booking.end_date),
      booking.special_requests || 'None',
      bookingRef
    ];
    
    result.bookingRef = bookingRef;
    result.success = true;
    result.message = 'Booking query prepared successfully';
    
    // Add booking summary
    result.bookingSummary = {
      customer: booking.customer_name,
      phone: booking.phone,
      vehicle: `${booking.vehicle_make} ${booking.vehicle_model}`,
      dates: `${booking.start_date} to ${booking.end_date}`,
      reference: bookingRef
    };
    
  } else {
    result.success = false;
    result.message = 'Invalid booking data received';
    result.error = 'Missing booking information';
  }
  
} catch (error) {
  console.error("Error preparing booking:", error);
  result.success = false;
  result.error = error.message;
  result.message = "Failed to prepare booking query";
}

console.log("Booking result:", JSON.stringify(result, null, 2));

// Return the SQL query and parameters for the PostgreSQL node
return [
  {
    json: {
      sqlQuery: result.sqlQuery,
      parameters: result.parameters,
      bookingRef: result.bookingRef,
      success: result.success,
      message: result.message,
      bookingSummary: result.bookingSummary || null
    }
  }
];