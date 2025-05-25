import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { insertInvoiceSchema, invoiceFormSchema } from '@shared/schema';
import { authenticate } from '../middleware/auth';
import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';

const router = Router();

/**
 * Get all invoices
 * GET /api/invoices
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const invoices = await storage.getInvoices();
    res.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ message: 'Failed to fetch invoices' });
  }
});

/**
 * Get a specific invoice by ID
 * GET /api/invoices/:id
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid invoice ID' });
    }

    const invoice = await storage.getInvoice(id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ message: 'Failed to fetch invoice' });
  }
});

/**
 * Get invoices for a specific customer
 * GET /api/invoices/customer/:customerId
 */
router.get('/customer/:customerId', async (req: Request, res: Response) => {
  try {
    const customerId = parseInt(req.params.customerId);
    if (isNaN(customerId)) {
      return res.status(400).json({ message: 'Invalid customer ID' });
    }

    const invoices = await storage.getInvoicesByCustomer(customerId);
    res.json(invoices);
  } catch (error) {
    console.error('Error fetching customer invoices:', error);
    res.status(500).json({ message: 'Failed to fetch customer invoices' });
  }
});

/**
 * Get invoices for a specific booking
 * GET /api/invoices/booking/:bookingId
 */
router.get('/booking/:bookingId', async (req: Request, res: Response) => {
  try {
    const bookingId = parseInt(req.params.bookingId);
    if (isNaN(bookingId)) {
      return res.status(400).json({ message: 'Invalid booking ID' });
    }

    const invoices = await storage.getInvoicesByBooking(bookingId);
    res.json(invoices);
  } catch (error) {
    console.error('Error fetching booking invoices:', error);
    res.status(500).json({ message: 'Failed to fetch booking invoices' });
  }
});

/**
 * Create a new invoice
 * POST /api/invoices
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    console.log('Creating invoice with data:', req.body);
    
    // Validate the request body
    const validatedData = insertInvoiceSchema.parse(req.body);

    // Create the invoice
    const invoice = await storage.createInvoice(validatedData);
    res.status(201).json(invoice);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationError = fromZodError(error);
      console.error('Validation error creating invoice:', validationError.message);
      return res.status(400).json({ message: validationError.message, details: validationError.details });
    }
    console.error('Error creating invoice:', error);
    res.status(500).json({ message: 'Failed to create invoice', error: String(error) });
  }
});

/**
 * Update invoice status
 * PATCH /api/invoices/:id/status
 */
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid invoice ID' });
    }

    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const invoice = await storage.updateInvoiceStatus(id, status);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (error) {
    console.error('Error updating invoice status:', error);
    res.status(500).json({ message: 'Failed to update invoice status' });
  }
});

/**
 * Delete an invoice
 * DELETE /api/invoices/:id
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid invoice ID' });
    }

    // Check if invoice exists
    const invoice = await storage.getInvoice(id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Delete the invoice
    const deleted = await storage.deleteInvoice(id);
    if (!deleted) {
      return res.status(500).json({ message: 'Failed to delete invoice' });
    }

    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ message: 'Failed to delete invoice' });
  }
});

/**
 * Update an invoice
 * PATCH /api/invoices/:id
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid invoice ID' });
    }

    // Get the existing invoice
    const existingInvoice = await storage.getInvoice(id);
    if (!existingInvoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Update the invoice with new data
    try {
      const validatedData = insertInvoiceSchema.parse({
        ...existingInvoice,
        ...req.body,
        id: undefined, // Ensure ID isn't changed
        createdAt: undefined, // Don't change created date
      });

      // If we have items as a string in the request body (JSON stringified), parse it
      if (req.body.items && typeof req.body.items === 'string') {
        try {
          JSON.parse(req.body.items);
        } catch (e) {
          return res.status(400).json({ message: 'Invalid items format' });
        }
      }

      // Handle updating the invoice
      const result = await storage.updateInvoice(id, validatedData);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ message: 'Failed to update invoice' });
  }
});

export default router;