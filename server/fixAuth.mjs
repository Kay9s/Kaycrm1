// Direct database connection to fix login issues
import pg from 'pg';
import bcrypt from 'bcrypt';
const { Pool } = pg;

// Connect to database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function fixAuthentication() {
  console.log("Starting authentication fix...");
  
  try {
    // Create a test user with known credentials
    const password = await bcrypt.hash('test123', 10);
    const username = 'test';
    
    // First check if user exists
    const checkResult = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    
    if (checkResult.rows.length === 0) {
      // User doesn't exist, create it
      const result = await pool.query(
        'INSERT INTO users (username, password, "fullName", email, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [username, password, 'Test User', 'test@carflow.com', 'admin']
      );
      
      console.log(`Created test user with id: ${result.rows[0].id}`);
    } else {
      // Update existing user with known password
      const result = await pool.query(
        'UPDATE users SET password = $1 WHERE username = $2 RETURNING *',
        [password, username]
      );
      
      console.log(`Updated test user with id: ${result.rows[0].id}`);
    }
    
    console.log("Authentication fix completed. You can now login with:");
    console.log("Username: test");
    console.log("Password: test123");
    
  } catch (error) {
    console.error("Error fixing authentication:", error);
  } finally {
    pool.end();
  }
}

fixAuthentication();