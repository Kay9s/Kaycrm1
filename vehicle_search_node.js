// Vehicle Search Node for n8n workflow
// Handles flexible vehicle searching based on user input
// Returns ALL available vehicles matching criteria

const inputData = $input.all();
console.log("Input data:", JSON.stringify(inputData, null, 2));

// Get the processed data from previous node
const searchData = inputData[0].json;

// Database connection parameters (adjust as needed)
const dbConfig = {
  host: process.env.PGHOST || 'localhost',
  port: process.env.PGPORT || 5432,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD
};

// Build SQL query based on search criteria
function buildSearchQuery(filters) {
  let query = `
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
    WHERE v.is_available = true
  `;
  
  const params = [];
  let paramCount = 0;
  
  // Add filters based on available data
  if (filters.make) {
    paramCount++;
    query += ` AND LOWER(v.make) = LOWER($${paramCount})`;
    params.push(filters.make);
  }
  
  if (filters.model) {
    paramCount++;
    query += ` AND LOWER(v.model) = LOWER($${paramCount})`;
    params.push(filters.model);
  }
  
  if (filters.category && filters.category !== 'all') {
    paramCount++;
    query += ` AND LOWER(v.category) = LOWER($${paramCount})`;
    params.push(filters.category);
  }
  
  if (filters.year) {
    paramCount++;
    query += ` AND v.year = $${paramCount}`;
    params.push(filters.year);
  }
  
  if (filters.min_year) {
    paramCount++;
    query += ` AND v.year >= $${paramCount}`;
    params.push(filters.min_year);
  }
  
  if (filters.max_year) {
    paramCount++;
    query += ` AND v.year <= $${paramCount}`;
    params.push(filters.max_year);
  }
  
  query += ` ORDER BY v.category, v.make, v.model, v.year`;
  
  return { query, params };
}

// Process search request
function processVehicleSearch(requestData) {
  try {
    console.log("Processing request:", requestData.requestType);
    
    if (requestData.requestType === "vehicles" && requestData.filters) {
      const filters = requestData.filters;
      const { query, params } = buildSearchQuery(filters);
      
      console.log("Generated SQL:", query);
      console.log("Parameters:", params);
      
      return {
        success: true,
        query: query,
        parameters: params,
        searchCriteria: filters,
        message: "Vehicle search query generated successfully"
      };
    }
    
    // Handle booking requests
    else if (requestData.requestType === "booking" && requestData.bookingData) {
      return {
        success: true,
        action: "create_booking",
        bookingData: requestData.bookingData,
        message: "Booking request processed"
      };
    }
    
    // Handle availability checks
    else if (requestData.requestType === "availability_check") {
      const filters = {
        make: requestData.availabilityQuery.make,
        model: requestData.availabilityQuery.model,
        category: requestData.availabilityQuery.category
      };
      
      const { query, params } = buildSearchQuery(filters);
      
      return {
        success: true,
        query: query,
        parameters: params,
        availabilityCheck: true,
        startDate: requestData.availabilityQuery.start_date,
        endDate: requestData.availabilityQuery.end_date,
        message: "Availability check query generated"
      };
    }
    
    // Default case - return all available vehicles
    else {
      const { query, params } = buildSearchQuery({});
      
      return {
        success: true,
        query: query,
        parameters: params,
        searchCriteria: { category: "all" },
        message: "Returning all available vehicles"
      };
    }
    
  } catch (error) {
    console.error("Error processing search:", error);
    return {
      success: false,
      error: error.message,
      message: "Error processing vehicle search request"
    };
  }
}

// Main execution
let result;

try {
  if (searchData && searchData.success) {
    result = processVehicleSearch(searchData);
  } else {
    // Fallback - return all vehicles
    const { query, params } = buildSearchQuery({});
    result = {
      success: true,
      query: query,
      parameters: params,
      searchCriteria: { category: "all" },
      message: "Returning all available vehicles (fallback)"
    };
  }
  
  // Add database configuration
  result.dbConfig = dbConfig;
  result.timestamp = new Date().toISOString();
  
} catch (error) {
  console.error("Main execution error:", error);
  result = {
    success: false,
    error: error.message,
    message: "Failed to process vehicle search"
  };
}

console.log("Final result:", JSON.stringify(result, null, 2));

return { json: result };