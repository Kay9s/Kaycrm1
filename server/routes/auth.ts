import { Router, Request, Response } from 'express';
import { z } from 'zod';
import * as authService from '../services/auth';
import jwt from 'jsonwebtoken';
import { fromZodError } from 'zod-validation-error';

const router = Router();

// Schema for user registration
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  role: z.enum(['user', 'admin']).optional(),
});

// Schema for user login
const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

// Register a new user
router.post('/register', async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);
    
    const { user, token } = await authService.registerUser(
      data.username,
      data.password,
      data.fullName,
      data.email,
      data.role
    );
    
    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    
    res.status(201).json({
      message: 'User registered successfully',
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({ error: validationError.message });
    }
    
    if (error instanceof Error && error.message === 'Username already exists') {
      return res.status(409).json({ error: 'Username already exists' });
    }
    
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Login a user
router.post('/login', async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);
    
    const { user, token } = await authService.loginUser(
      data.username,
      data.password
    );
    
    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    
    res.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({ error: validationError.message });
    }
    
    if (error instanceof Error && error.message === 'Invalid username or password') {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Failed to log in' });
  }
});

// Get current user profile
router.get('/profile', async (req: Request, res: Response) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const token = authHeader.split(' ')[1];
    const payload = authService.verifyToken(token);
    
    if (!payload) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    const user = await authService.getUserById(payload.sub);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    
    res.json({
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

export default router;