import { Router, Request, Response } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import * as googleService from '../services/googleService';
import { storage } from '../storage';

const router = Router();

// Auth URLs for Google services
// Test Google services connection
router.get('/calendar/test', authenticate, requireAdmin, (req: Request, res: Response) => {
  try {
    const isAuth = googleService.isAuthenticated();
    if (!isAuth) {
      const authUrl = googleService.getAuthUrl();
      return res.json({ 
        authenticated: false, 
        message: 'Google services not authenticated. Please complete OAuth flow.',
        authUrl 
      });
    }
    res.json({ 
      authenticated: true, 
      message: 'Google services are authenticated and ready' 
    });
  } catch (error) {
    console.error('Error testing Google connection:', error);
    res.status(500).json({ error: 'Failed to test Google connection' });
  }
});

router.get('/auth/url', authenticate, requireAdmin, (req: Request, res: Response) => {
  try {
    const authUrl = googleService.getAuthUrl();
    res.json({ authUrl });
  } catch (error) {
    console.error('Error getting Google auth URL:', error);
    res.status(500).json({ error: 'Failed to get Google auth URL' });
  }
});

// OAuth callback handler
router.get('/callback', async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query;
    
    if (!code) {
      return res.status(400).json({ error: 'No authorization code provided' });
    }
    
    // State should indicate which service (calendar or sheets)
    if (state === 'calendar') {
      const tokens = await googleCalendarService.handleCallback(code as string);
      res.json({ message: 'Google Calendar successfully authenticated', tokens });
    } else if (state === 'sheets') {
      const tokens = await googleSheetsService.handleCallback(code as string);
      res.json({ message: 'Google Sheets successfully authenticated', tokens });
    } else {
      res.status(400).json({ error: 'Invalid state parameter' });
    }
  } catch (error) {
    console.error('Error handling Google callback:', error);
    res.status(500).json({ error: 'Failed to authenticate with Google' });
  }
});

// Create a new Google Sheet for bookings export
router.post('/sheets/bookings', authenticate, async (req: Request, res: Response) => {
  try {
    const { title } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Sheet title is required' });
    }
    
    const spreadsheetId = await googleSheetsService.createBookingsSheet(title);
    
    if (!spreadsheetId) {
      return res.status(500).json({ error: 'Failed to create Google Sheet' });
    }
    
    res.json({ 
      message: 'Google Sheet created successfully', 
      spreadsheetId,
      url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`
    });
  } catch (error) {
    console.error('Error creating Google Sheet:', error);
    res.status(500).json({ error: 'Failed to create Google Sheet' });
  }
});

// Add bookings to a Google Sheet
router.post('/sheets/bookings/:spreadsheetId', authenticate, async (req: Request, res: Response) => {
  try {
    const { spreadsheetId } = req.params;
    const { bookings } = req.body;
    
    if (!bookings || !Array.isArray(bookings) || bookings.length === 0) {
      return res.status(400).json({ error: 'Bookings data is required' });
    }
    
    const success = await googleSheetsService.addBookingsToSheet(spreadsheetId, bookings);
    
    if (!success) {
      return res.status(500).json({ error: 'Failed to add bookings to Google Sheet' });
    }
    
    res.json({ 
      message: 'Bookings added to Google Sheet successfully',
      url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`
    });
  } catch (error) {
    console.error('Error adding bookings to Google Sheet:', error);
    res.status(500).json({ error: 'Failed to add bookings to Google Sheet' });
  }
});

// Add a booking to Google Calendar
router.post('/calendar/booking', authenticate, async (req: Request, res: Response) => {
  try {
    const booking = req.body;
    
    if (!booking || !booking.bookingRef) {
      return res.status(400).json({ error: 'Valid booking data is required' });
    }
    
    const eventId = await googleCalendarService.addBookingToCalendar(booking);
    
    if (!eventId) {
      return res.status(500).json({ error: 'Failed to add booking to Google Calendar' });
    }
    
    res.json({ 
      message: 'Booking added to Google Calendar successfully',
      eventId
    });
  } catch (error) {
    console.error('Error adding booking to Google Calendar:', error);
    res.status(500).json({ error: 'Failed to add booking to Google Calendar' });
  }
});

export default router;