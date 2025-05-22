import { Router, Request, Response } from 'express';
import * as googleCalendarService from '../services/googleCalendar';
import * as googleSheetsService from '../services/googleSheets';

const router = Router();

// Test endpoint for Google Calendar
router.get('/google/calendar', async (req: Request, res: Response) => {
  try {
    if (!googleCalendarService.isAuthenticated()) {
      return res.status(401).json({ 
        success: false, 
        message: 'Not authenticated with Google Calendar'
      });
    }
    // Just return success if authenticated
    return res.status(200).json({ 
      success: true, 
      message: 'Successfully authenticated with Google Calendar'
    });
  } catch (error: any) {
    console.error('Error testing Google Calendar:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Error testing Google Calendar connection'
    });
  }
});

// Test endpoint for Google Sheets
router.get('/google/sheets', async (req: Request, res: Response) => {
  try {
    if (!googleSheetsService.isAuthenticated()) {
      return res.status(401).json({ 
        success: false, 
        message: 'Not authenticated with Google Sheets'
      });
    }
    // Just return success if authenticated
    return res.status(200).json({ 
      success: true, 
      message: 'Successfully authenticated with Google Sheets'
    });
  } catch (error: any) {
    console.error('Error testing Google Sheets:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Error testing Google Sheets connection'
    });
  }
});

export default router;