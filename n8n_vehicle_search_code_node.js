// n8n Code Node for Vehicle Search
// This goes in the "Code" node in n8n workflow

// Get input data from previous node
const inputData = $input.all();
const searchData = inputData[0].json;

console.log("Search input:", JSON.stringify(searchData, null, 2));

// Initialize result
let result = {
  success: false,
  sqlQuery: '',
  parameters: [],
  searchType: 'all',
  message: ''
};

try {
  // Check if we have vehicle search request
  if (searchData.requestType === "vehicles" && searchData.filters) {
    const filters = searchData.filters;
    
    // Build SQL query based on what user requested
    let whereConditions = ["v.is_available = true"];
    let params = [];
    let paramCount = 0;
    
    // Determine search type and build appropriate query
    if (filters.category && filters.category !== 'all' && filters.category !== null) {
      // Category search - get ALL vehicles in that category
      paramCount++;
      whereConditions.push(`LOWER(v.category) = LOWER($${paramCount})`);
      params.push(filters.category);
      result.searchType = 'category';
    }
    
    if (filters.make && filters.make !== null) {
      // Make search - get ALL vehicles of that make
      paramCount++;
      whereConditions.push(`LOWER(v.make) = LOWER($${paramCount})`);
      params.push(filters.make);
      result.searchType = 'make';
    }
    
    if (filters.model && filters.model !== null) {
      // Model search - get ALL vehicles of that model
      paramCount++;
      whereConditions.push(`LOWER(v.model) = LOWER($${paramCount})`);
      params.push(filters.model);
      result.searchType = 'model';
    }
    
    if (filters.year && filters.year !== null) {
      // Year search - get ALL vehicles from that year
      paramCount++;
      whereConditions.push(`v.year = $${paramCount}`);
      params.push(filters.year);
      result.searchType = 'year';
    }
    
    if (filters.min_year && filters.min_year !== null) {
      paramCount++;
      whereConditions.push(`v.year >= $${paramCount}`);
      params.push(filters.min_year);
    }
    
    if (filters.max_year && filters.max_year !== null) {
      paramCount++;
      whereConditions.push(`v.year <= $${paramCount}`);
      params.push(filters.max_year);
    }
    
    // Build complete SQL query
    result.sqlQuery = `
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
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY v.category, v.make, v.model, v.year
    `;
    
    result.parameters = params;
    result.success = true;
    result.message = `Generated query for ${result.searchType} search`;
    
    // Add search summary
    result.searchSummary = {
      type: result.searchType,
      filters: filters,
      parameterCount: paramCount
    };
    
  } else {
    // Default - return ALL available vehicles
    result.sqlQuery = `
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
      ORDER BY v.category, v.make, v.model, v.year
    `;
    
    result.parameters = [];
    result.success = true;
    result.searchType = 'all';
    result.message = 'Returning all available vehicles';
  }
  
} catch (error) {
  console.error("Error building query:", error);
  result.success = false;
  result.error = error.message;
  result.message = "Failed to build search query";
}

console.log("Query result:", JSON.stringify(result, null, 2));

// Return the SQL query and parameters for the next PostgreSQL node
return [
  {
    json: {
      sqlQuery: result.sqlQuery,
      parameters: result.parameters,
      searchType: result.searchType,
      success: result.success,
      message: result.message
    }
  }
];