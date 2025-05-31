import { Router, Request, Response } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import * as googleService from '../services/googleService';
import { storage } from '../storage';

const router = Router();

// Google OAuth flow - these routes don't need authentication
router.get('/auth', (req: Request, res: Response) => {
  try {
    console.log('Starting Google OAuth flow...');
    console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);
    console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Not set');
    console.log('REPLIT_DOMAINS:', process.env.REPLIT_DOMAINS);
    
    const authUrl = googleService.getAuthUrl();
    console.log('Generated auth URL:', authUrl);
    res.redirect(authUrl);
  } catch (error) {
    console.error('Error starting Google auth:', error);
    res.status(500).json({ error: 'Failed to start Google authentication' });
  }
});

router.get('/auth/url', (req: Request, res: Response) => {
  try {
    const authUrl = googleService.getAuthUrl();
    res.json({ authUrl });
  } catch (error) {
    console.error('Error getting Google auth URL:', error);
    res.status(500).json({ error: 'Failed to get Google auth URL' });
  }
});

// OAuth callback handler
router.get('/auth/callback', async (req: Request, res: Response) => {
  try {
    console.log('Google OAuth callback received');
    console.log('Query params:', req.query);
    
    const { code } = req.query;
    
    if (!code) {
      console.log('No authorization code provided');
      return res.status(400).json({ error: 'No authorization code provided' });
    }
    
    console.log('Processing authorization code...');
    const tokens = await googleService.handleCallback(code as string);
    console.log('Tokens received successfully:', !!tokens);
    
    res.redirect('/integrations?auth=success');
  } catch (error) {
    console.error('Error handling Google callback:', error);
    res.redirect('/integrations?auth=error');
  }
});

// Test Google services connection - needs authentication
router.get('/calendar/test', authenticate, requireAdmin, (req: Request, res: Response) => {
  try {
    const isAuth = googleService.isAuthenticated();
    if (!isAuth) {
      return res.status(401).json({ 
        error: 'Authentication required',
        authenticated: false, 
        message: 'Google services not authenticated. Please complete OAuth flow.'
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

// Create a new Google Sheet for data export
router.post('/sheets/create', authenticate, async (req: Request, res: Response) => {
  try {
    const { title, data } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Sheet title is required' });
    }
    
    const result = await googleService.createReportSheet(title, data || []);
    
    res.json({ 
      message: 'Google Sheet created successfully', 
      ...result
    });
  } catch (error) {
    console.error('Error creating Google Sheet:', error);
    res.status(500).json({ error: 'Failed to create Google Sheet' });
  }
});

// Create a Google Doc for reports
router.post('/docs/create', authenticate, async (req: Request, res: Response) => {
  try {
    const { title, content } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Document title is required' });
    }
    
    const result = await googleService.createReportDocument(title, content || '');
    
    res.json({ 
      message: 'Google Document created successfully', 
      ...result
    });
  } catch (error) {
    console.error('Error creating Google Document:', error);
    res.status(500).json({ error: 'Failed to create Google Document' });
  }
});

// Sync bookings to Google Calendar
router.post('/calendar/sync', authenticate, async (req: Request, res: Response) => {
  try {
    // Get all bookings
    const bookings = await storage.getBookings();
    
    if (!bookings || bookings.length === 0) {
      return res.json({ message: 'No bookings to sync', results: [] });
    }
    
    const results = await googleService.syncCalendar(bookings);
    
    res.json({ 
      message: `Calendar sync completed. ${results.filter(r => r.success).length} bookings synced successfully.`,
      results
    });
  } catch (error) {
    console.error('Error syncing calendar:', error);
    res.status(500).json({ error: 'Failed to sync calendar' });
  }
});

// Add a single booking to Google Calendar
router.post('/calendar/booking', authenticate, async (req: Request, res: Response) => {
  try {
    const booking = req.body;
    
    if (!booking || !booking.bookingRef) {
      return res.status(400).json({ error: 'Valid booking data is required' });
    }
    
    const eventId = await googleService.addBookingToCalendar(booking);
    
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