import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '@shared/schema';
import { storage } from '../storage';

// JWT Secret key - should be in environment variables in production
const JWT_SECRET = process.env.JWT_SECRET || 'carflow-secret-key';
const JWT_EXPIRES_IN = '24h';

/**
 * Hash a password with bcrypt
 * @param password The password to hash
 * @returns The hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Verify a password against a hash
 * @param password The password to verify
 * @param hashedPassword The hashed password to compare against
 * @returns True if the password matches, false otherwise
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Generate a JWT for a user
 * @param user The user to generate a token for
 * @returns The JWT
 */
export function generateToken(user: User): string {
  const payload = {
    sub: user.id,
    username: user.username,
    role: user.role,
    email: user.email,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify a JWT
 * @param token The token to verify
 * @returns The decoded token payload if valid, null otherwise
 */
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

/**
 * Register a new user
 * @param username The username
 * @param password The password
 * @param fullName The full name
 * @param email The email
 * @param role The role (defaults to 'user')
 * @returns The created user and token
 */
export async function registerUser(
  username: string,
  password: string,
  fullName: string,
  email: string,
  role: string = 'user'
): Promise<{ user: User; token: string }> {
  // Check if user already exists
  const existingUser = await storage.getUserByUsername(username);
  if (existingUser) {
    throw new Error('Username already exists');
  }

  // Hash the password
  const hashedPassword = await hashPassword(password);

  // Create the user
  const user = await storage.createUser({
    username,
    password: hashedPassword,
    fullName,
    email,
    role,
  });

  // Generate a token
  const token = generateToken(user);

  return { user, token };
}

/**
 * Login a user
 * @param username The username
 * @param password The password
 * @returns The user and token if successful
 */
export async function loginUser(
  username: string,
  password: string
): Promise<{ user: User; token: string }> {
  // Get the user
  const user = await storage.getUserByUsername(username);
  if (!user) {
    throw new Error('Invalid username or password');
  }

  // Verify the password
  const passwordValid = await verifyPassword(password, user.password);
  if (!passwordValid) {
    throw new Error('Invalid username or password');
  }

  // Generate a token
  const token = generateToken(user);

  return { user, token };
}

/**
 * Get a user by ID
 * @param id The user ID
 * @returns The user if found
 */
export async function getUserById(id: number): Promise<User | undefined> {
  return storage.getUser(id);
}

/**
 * Check if a user is an admin
 * @param user The user to check
 * @returns True if the user is an admin
 */
export function isAdmin(user: User): boolean {
  return user.role === 'admin';
}

/**
 * Create a default admin user if none exists
 */
export async function createDefaultAdminIfNeeded(): Promise<void> {
  try {
    // Check if any admin user exists
    const adminExists = await storage.hasAdminUser();
    
    if (!adminExists) {
      console.log('Creating default admin user...');
      
      // Create a default admin user
      await registerUser(
        'admin',
        'admin123', // This should be changed immediately after first login
        'System Administrator',
        'admin@carflow.com',
        'admin'
      );
      
      console.log('Default admin user created successfully');
    }
  } catch (error) {
    console.error('Error creating default admin user:', error);
  }
}