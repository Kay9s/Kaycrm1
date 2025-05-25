import express, { Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { addBookingToCalendar } from '../services/googleCalendar';

const router = express.Router();

// Schema for validating meeting data
const meetingSchema = z.object({
  bookingId: z.string(),
  title: z.string(),
  startDateTime: z.string(),
  durationMinutes: z.number(),
  location: z.string(),
  description: z.string().optional(),
  attendees: z.array(z.string()).optional(),
  sendNotification: z.boolean().optional().default(true)
});

/**
 * Create a new pickup meeting in Google Calendar
 * POST /api/calendar/booking
 */
router.post('/booking', authenticate, async (req: Request, res: Response) => {
  try {
    // Validate the request body
    const validatedData = meetingSchema.parse(req.body);
    
    // Add the meeting to Google Calendar
    const eventId = await addBookingToCalendar({
      ...validatedData,
      booking: {
        id: parseInt(validatedData.bookingId),
        title: validatedData.title
      }
    });
    
    if (!eventId) {
      return res.status(500).json({ 
        error: 'Failed to create calendar event',
        message: 'The calendar event could not be created. Please try again or check Google Calendar connection.'
      });
    }
    
    // Return the event ID
    return res.status(201).json({ 
      success: true, 
      eventId,
      message: 'Meeting scheduled successfully'
    });
    
  } catch (error) {
    console.error('Error creating calendar event:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid request data',
        details: error.errors
      });
    }
    
    return res.status(500).json({ 
      error: 'Server error',
      message: 'An unexpected error occurred while scheduling the meeting'
    });
  }
});

export default router;