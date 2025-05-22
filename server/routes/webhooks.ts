import { Router } from 'express';
import { storage } from '../storage';

const router = Router();

/**
 * Handle webhook for new booking from n8n
 */
router.post('/booking', async (req, res) => {
  try {
    console.log('Received n8n webhook with booking data:', req.body);
    
    const bookingData = req.body;
    
    // Validate required fields
    if (!bookingData.customerId || !bookingData.vehicleId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: customerId and vehicleId are required' 
      });
    }
    
    // Process booking through storage layer
    const booking = await storage.updateBookingFromN8n(bookingData);
    
    return res.status(200).json({ 
      success: true, 
      message: 'Booking processed successfully',
      data: booking
    });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'An error occurred processing the webhook'
    });
  }
});

/**
 * Test endpoint for n8n connection
 */
router.get('/test', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'n8n webhook connection is working',
    timestamp: new Date().toISOString()
  });
});

/**
 * HTTP endpoint to send data to n8n
 * This is an alternative to webhook that can be used to send data to n8n
 */
router.post('/send-to-n8n', async (req, res) => {
  try {
    const { url, data } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'Missing n8n webhook URL'
      });
    }
    
    // Send data to n8n via webhook URL
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data || {})
    });
    
    if (!response.ok) {
      throw new Error(`Error sending data to n8n: ${response.statusText}`);
    }
    
    const responseData = await response.json();
    
    return res.status(200).json({
      success: true,
      message: 'Data sent to n8n successfully',
      response: responseData
    });
  } catch (error: any) {
    console.error('Error sending data to n8n:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'An error occurred sending data to n8n'
    });
  }
});

export default router;