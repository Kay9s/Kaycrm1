import * as authService from '../services/auth';

/**
 * Script to initialize test users
 */
async function initializeUsers() {
  try {
    console.log('Creating test users...');
    
    // Create admin user
    try {
      const { user } = await authService.registerUser(
        'admin',
        'password123',
        'Admin User',
        'admin@carflow.com',
        'admin'
      );
      console.log('Admin user created:', user.id);
    } catch (error: any) {
      if (error.message === 'Username already exists') {
        console.log('Admin user already exists');
      } else {
        throw error;
      }
    }
    
    // Create regular user
    try {
      const { user } = await authService.registerUser(
        'user',
        'password123',
        'Regular User',
        'user@carflow.com',
        'user'
      );
      console.log('Regular user created:', user.id);
    } catch (error: any) {
      if (error.message === 'Username already exists') {
        console.log('Regular user already exists');
      } else {
        throw error;
      }
    }
    
    console.log('Users initialized successfully');
    
  } catch (error) {
    console.error('Error initializing users:', error);
  }
}

// Execute the function
initializeUsers()
  .then(() => {
    console.log('User initialization complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('User initialization failed:', error);
    process.exit(1);
  });