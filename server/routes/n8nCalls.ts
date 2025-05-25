import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { insertN8nCallSchema } from '@shared/schema';
import { authenticate } from '../middleware/auth';
import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';

const router = Router();

/**
 * Get all n8n calls
 * GET /api/n8n-calls
 */
router.get('/', authenticate, async (_req: Request, res: Response) => {
  try {
    const calls = await storage.getN8nCalls();
    res.json(calls);
  } catch (error) {
    console.error('Error fetching n8n calls:', error);
    res.status(500).json({ message: 'Failed to fetch n8n calls' });
  }
});

/**
 * Get a specific n8n call by ID
 * GET /api/n8n-calls/:id
 */
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid call ID' });
    }

    const call = await storage.getN8nCall(id);
    if (!call) {
      return res.status(404).json({ message: 'Call not found' });
    }

    res.json(call);
  } catch (error) {
    console.error('Error fetching n8n call:', error);
    res.status(500).json({ message: 'Failed to fetch n8n call' });
  }
});

/**
 * Get n8n calls by status
 * GET /api/n8n-calls/status/:status
 */
router.get('/status/:status', authenticate, async (req: Request, res: Response) => {
  try {
    const status = req.params.status;
    const calls = await storage.getN8nCallsByStatus(status);
    res.json(calls);
  } catch (error) {
    console.error('Error fetching n8n calls by status:', error);
    res.status(500).json({ message: 'Failed to fetch n8n calls by status' });
  }
});

/**
 * Create a new n8n call
 * POST /api/n8n-calls
 */
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    // Validate the request body
    const validatedData = insertN8nCallSchema.parse(req.body);

    // Create the call
    const call = await storage.createN8nCall(validatedData);
    res.status(201).json(call);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({ message: validationError.message });
    }
    console.error('Error creating n8n call:', error);
    res.status(500).json({ message: 'Failed to create n8n call' });
  }
});

/**
 * Update an n8n call
 * PATCH /api/n8n-calls/:id
 */
router.patch('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid call ID' });
    }

    // Check if call exists
    const existingCall = await storage.getN8nCall(id);
    if (!existingCall) {
      return res.status(404).json({ message: 'Call not found' });
    }

    // Validate and update the call data
    try {
      const validatedData = insertN8nCallSchema.partial().parse(req.body);
      const updatedCall = await storage.updateN8nCall(id, validatedData);
      res.json(updatedCall);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error updating n8n call:', error);
    res.status(500).json({ message: 'Failed to update n8n call' });
  }
});

/**
 * Delete an n8n call
 * DELETE /api/n8n-calls/:id
 */
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid call ID' });
    }

    // Check if call exists
    const call = await storage.getN8nCall(id);
    if (!call) {
      return res.status(404).json({ message: 'Call not found' });
    }

    // Delete the call
    const deleted = await storage.deleteN8nCall(id);
    if (!deleted) {
      return res.status(500).json({ message: 'Failed to delete call' });
    }

    res.json({ message: 'Call deleted successfully' });
  } catch (error) {
    console.error('Error deleting n8n call:', error);
    res.status(500).json({ message: 'Failed to delete n8n call' });
  }
});

export default router;