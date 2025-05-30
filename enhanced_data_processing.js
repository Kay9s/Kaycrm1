// Enhanced ElevenLabs data processing for car rental booking
let body = $json.body || $json;

console.log("ElevenLabs request:", JSON.stringify(body, null, 2));

// Extract data from ElevenLabs webhook with enhanced flexibility
function getParameter(obj, keys) {
  for (let key of keys) {
    if (obj && obj[key] !== undefined && obj[key] !== null && obj[key] !== "") {
      return obj[key];
    }
  }
  return null;
}

// Enhanced date parsing for multiple formats
function parseDate(dateStr) {
  if (!dateStr) return null;
  
  // Handle various date formats
  const formats = [
    /(\d{4})-(\d{1,2})-(\d{1,2})/, // YYYY-MM-DD
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // MM/DD/YYYY or DD/MM/YYYY
    /(\d{1,2})-(\d{1,2})-(\d{4})/, // MM-DD-YYYY or DD-MM-YYYY
  ];
  
  for (let format of formats) {
    const match = dateStr.match(format);
    if (match) {
      const [, first, second, third] = match;
      // Assume YYYY-MM-DD format for consistent storage
      if (third.length === 4) {
        return `${third}-${second.padStart(2, '0')}-${first.padStart(2, '0')}`;
      } else {
        return `${first}-${second.padStart(2, '0')}-${third.padStart(2, '0')}`;
      }
    }
  }
  
  return dateStr; // Return as-is if no format matches
}

// Enhanced text processing for flexible search
function processSearchText(text) {
  if (!text) return null;
  return text.toString().toLowerCase().trim();
}

// Extract year from various inputs
function extractYear(input) {
  if (!input) return null;
  
  // If it's already a number
  if (typeof input === 'number') return input;
  
  // Extract 4-digit year from string
  const yearMatch = input.toString().match(/\b(19|20)\d{2}\b/);
  if (yearMatch) {
    return parseInt(yearMatch[0]);
  }
  
  return null;
}

let response = {
  success: false,
  requestType: "unknown",
  data: null,
  timestamp: new Date().toISOString()
};

try {
  // ElevenLabs sends action field for tool routing
  const action = body.action || body.tool_name || body.function_name;
  const parameters = body.parameters || body.arguments || body.data || body;
  
  console.log("Action:", action);
  console.log("Parameters:", JSON.stringify(parameters, null, 2));
  
  // Enhanced vehicle search with flexible filtering
  if (action === 'get_vehicles' || action === 'get_available_vehicles' || action === 'search_vehicles') {
    response.requestType = "vehicles";
    
    // Extract search parameters with enhanced flexibility
    const category = getParameter(parameters, ['category', 'vehicle_category', 'car_category', 'type']);
    const make = getParameter(parameters, ['make', 'vehicle_make', 'brand', 'manufacturer']);
    const model = getParameter(parameters, ['model', 'vehicle_model', 'car_model']);
    const year = extractYear(getParameter(parameters, ['year', 'vehicle_year', 'model_year']));
    const minYear = extractYear(getParameter(parameters, ['min_year', 'year_from', 'from_year']));
    const maxYear = extractYear(getParameter(parameters, ['max_year', 'year_to', 'to_year']));
    
    response.filters = {
      category: category && category !== 'all' ? processSearchText(category) : null,
      make: make ? processSearchText(make) : null,
      model: model ? processSearchText(model) : null,
      year: year,
      min_year: minYear,
      max_year: maxYear,
      transmission: getParameter(parameters, ['transmission', 'gear']),
      fuel_type: getParameter(parameters, ['fuel_type', 'fuel', 'engine_type']),
      seats: getParameter(parameters, ['seats', 'passengers', 'seating']),
      doors: getParameter(parameters, ['doors'])
    };
    
    // If only year is provided, use it as both min and max
    if (year && !minYear && !maxYear) {
      response.filters.min_year = year;
      response.filters.max_year = year;
    }
    
    console.log("Vehicle search filters:", JSON.stringify(response.filters, null, 2));
  }
  
  // Enhanced pricing calculation
  else if (action === 'calculate_rental_price' || action === 'get_price' || action === 'pricing') {
    response.requestType = "pricing";
    response.priceQuery = {
      vehicle_id: getParameter(parameters, ['vehicle_id', 'car_id', 'id']),
      vehicle_make: processSearchText(getParameter(parameters, ['vehicle_make', 'make'])),
      vehicle_model: processSearchText(getParameter(parameters, ['vehicle_model', 'model'])),
      category: processSearchText(getParameter(parameters, ['category', 'vehicle_category'])),
      start_date: parseDate(getParameter(parameters, ['start_date', 'pickup_date', 'from_date'])),
      end_date: parseDate(getParameter(parameters, ['end_date', 'return_date', 'to_date'])),
      rental_days: getParameter(parameters, ['rental_days', 'days', 'duration']),
      include_insurance: getParameter(parameters, ['include_insurance', 'insurance']) !== false,
      rental_type: getParameter(parameters, ['rental_type']) || 'daily', // daily, weekly, monthly
      additional_options: parameters.additional_options || {}
    };
  }
  
  // Enhanced booking creation
  else if (action === 'create_booking' || action === 'book' || action === 'reserve') {
    response.requestType = "booking";
    response.bookingData = {
      customer_name: getParameter(parameters, ['customer_name', 'name', 'full_name']),
      email: getParameter(parameters, ['email', 'customer_email', 'email_address']),
      phone: getParameter(parameters, ['phone', 'customer_phone', 'phone_number', 'mobile']),
      driver_license: getParameter(parameters, ['driver_license', 'license', 'driving_license']),
      vehicle_id: getParameter(parameters, ['vehicle_id', 'car_id', 'id']),
      vehicle_make: processSearchText(getParameter(parameters, ['vehicle_make', 'make'])),
      vehicle_model: processSearchText(getParameter(parameters, ['vehicle_model', 'model'])),
      start_date: parseDate(getParameter(parameters, ['start_date', 'pickup_date', 'from_date'])),
      end_date: parseDate(getParameter(parameters, ['end_date', 'return_date', 'to_date'])),
      pickup_time: getParameter(parameters, ['pickup_time', 'start_time']) || '09:00',
      return_time: getParameter(parameters, ['return_time', 'end_time']) || '17:00',
      pickup_location: getParameter(parameters, ['pickup_location', 'pickup_address']),
      return_location: getParameter(parameters, ['return_location', 'return_address']),
      special_requests: getParameter(parameters, ['special_requests', 'notes', 'comments', 'requirements']),
      driver_age: getParameter(parameters, ['driver_age', 'age']),
      additional_drivers: getParameter(parameters, ['additional_drivers', 'extra_drivers']),
      payment_method: getParameter(parameters, ['payment_method']),
      additional_options: parameters.additional_options || {}
    };
    
    // Enhanced validation with detailed error messages
    const required = ['customer_name', 'phone', 'start_date', 'end_date'];
    const missing = required.filter(field => !response.bookingData[field]);
    
    if (missing.length > 0) {
      response.validationErrors = missing;
      response.message = `I need some more information to complete your booking: ${missing.map(field => {
        switch(field) {
          case 'customer_name': return 'your full name';
          case 'phone': return 'your phone number';
          case 'start_date': return 'pickup date';
          case 'end_date': return 'return date';
          default: return field;
        }
      }).join(', ')}. Please provide these details.`;
    }
  }
  
  // Enhanced booking lookup
  else if (action === 'get_booking_details' || action === 'find_booking' || action === 'booking_status') {
    response.requestType = "booking_lookup";
    response.lookupData = {
      booking_reference: getParameter(parameters, ['booking_reference', 'reference', 'booking_id']),
      customer_name: getParameter(parameters, ['customer_name', 'name']),
      phone: getParameter(parameters, ['phone', 'customer_phone'])
    };
  }
  
  // Enhanced availability check
  else if (action === 'check_vehicle_availability' || action === 'availability' || action === 'check_availability') {
    response.requestType = "availability_check";
    response.availabilityQuery = {
      vehicle_ids: parameters.vehicle_ids || [],
      vehicle_id: getParameter(parameters, ['vehicle_id', 'car_id']),
      start_date: parseDate(getParameter(parameters, ['start_date', 'pickup_date'])),
      end_date: parseDate(getParameter(parameters, ['end_date', 'return_date'])),
      category: processSearchText(getParameter(parameters, ['category', 'vehicle_category'])),
      make: processSearchText(getParameter(parameters, ['make', 'vehicle_make'])),
      model: processSearchText(getParameter(parameters, ['model', 'vehicle_model']))
    };
  }
  
  // Enhanced booking modification
  else if (action === 'modify_booking' || action === 'change_booking' || action === 'update_booking') {
    response.requestType = "booking_modification";
    response.modificationData = {
      booking_reference: getParameter(parameters, ['booking_reference', 'reference']),
      customer_name: getParameter(parameters, ['customer_name', 'name']),
      phone: getParameter(parameters, ['phone', 'customer_phone']),
      new_start_date: parseDate(getParameter(parameters, ['new_start_date', 'start_date'])),
      new_end_date: parseDate(getParameter(parameters, ['new_end_date', 'end_date'])),
      new_vehicle_id: getParameter(parameters, ['new_vehicle_id', 'vehicle_id']),
      new_pickup_location: getParameter(parameters, ['new_pickup_location', 'pickup_location']),
      new_return_location: getParameter(parameters, ['new_return_location', 'return_location']),
      new_special_requests: getParameter(parameters, ['new_special_requests', 'special_requests'])
    };
  }
  
  // Enhanced booking cancellation
  else if (action === 'cancel_booking' || action === 'cancel' || action === 'booking_cancellation') {
    response.requestType = "booking_cancellation";
    response.cancellationData = {
      booking_reference: getParameter(parameters, ['booking_reference', 'reference']),
      customer_name: getParameter(parameters, ['customer_name', 'name']),
      phone: getParameter(parameters, ['phone', 'customer_phone']),
      cancellation_reason: getParameter(parameters, ['cancellation_reason', 'reason'])
    };
  }
  
  // Handle natural language or unstructured requests
  else {
    response.requestType = "natural_language";
    response.naturalLanguageQuery = {
      original_text: body.text || body.message || JSON.stringify(body),
      detected_intent: null,
      entities: {}
    };
    
    // Try to detect intent from text
    const text = (body.text || body.message || '').toLowerCase();
    
    if (text.includes('book') || text.includes('reserve') || text.includes('rent')) {
      response.naturalLanguageQuery.detected_intent = 'booking';
    } else if (text.includes('available') || text.includes('search') || text.includes('find')) {
      response.naturalLanguageQuery.detected_intent = 'search_vehicles';
    } else if (text.includes('price') || text.includes('cost') || text.includes('rate')) {
      response.naturalLanguageQuery.detected_intent = 'pricing';
    } else if (text.includes('cancel')) {
      response.naturalLanguageQuery.detected_intent = 'cancellation';
    }
    
    response.message = "I can help you with vehicle rentals. I can search for available vehicles, calculate prices, create bookings, or help with existing reservations. What would you like to do?";
  }
  
  response.success = true;
  response.originalData = body;
  response.processingTime = new Date().toISOString();
  
} catch (error) {
  console.error('Processing error:', error);
  response.success = false;
  response.error = error.message;
  response.message = "I encountered an error processing your request. Please try again or contact support if the issue persists.";
}

console.log("Final response:", JSON.stringify(response, null, 2));
return { json: response };