import { Router, Request, Response } from 'express';
import { storage } from '../storage';

const router = Router();

/**
 * Handle n8n HTTP request for new booking
 * This endpoint allows the n8n AI agent to create a new booking
 */
router.post('/booking', async (req, res) => {
  try {
    console.log('Received n8n HTTP request with booking data:', req.body);
    
    const bookingData = req.body;
    
    // Check if we need to create a new customer
    let customerId = bookingData.customerId;
    
    // If customer info is provided but no customerId, create a new customer first
    if (!customerId && bookingData.customerInfo) {
      const customerInfo = bookingData.customerInfo;
      
      try {
        // Check if customer already exists by email
        let existingCustomer = null;
        if (customerInfo.email) {
          const customers = await storage.getCustomers();
          existingCustomer = customers.find(c => c.email === customerInfo.email);
        }
        
        if (existingCustomer) {
          customerId = existingCustomer.id;
          console.log(`Using existing customer with ID: ${customerId}`);
        } else {
          // Create new customer
          const newCustomer = await storage.createCustomer({
            fullName: customerInfo.fullName || customerInfo.name || 'Guest',
            email: customerInfo.email || 'guest@example.com',
            phone: customerInfo.phone || '',
            address: customerInfo.address || '',
            driverLicense: customerInfo.driverLicense || '',
            notes: customerInfo.notes || 'Created via n8n integration',
            source: 'n8n'
          });
          customerId = newCustomer.id;
          console.log(`Created new customer with ID: ${customerId}`);
        }
      } catch (customerError) {
        console.error('Error creating/finding customer:', customerError);
        return res.status(400).json({
          success: false,
          message: 'Could not process customer information'
        });
      }
    }
    
    // Validate required fields
    if (!customerId || !bookingData.vehicleId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: customerId/customerInfo and vehicleId are required' 
      });
    }
    
    // Create the booking
    const booking = await storage.createBooking({
      customerId: customerId,
      vehicleId: bookingData.vehicleId,
      startDate: new Date(bookingData.startDate || bookingData.pickupDate || new Date()),
      endDate: new Date(bookingData.endDate || bookingData.returnDate || new Date(Date.now() + 86400000)), // Default to 1 day rental
      totalAmount: bookingData.totalAmount || 0,
      status: bookingData.status || 'pending',
      bookingRef: bookingData.bookingRef || `BK-${Math.floor(1000 + Math.random() * 9000)}`,
      paymentStatus: bookingData.paymentStatus || 'pending',
      source: 'n8n',
      notes: bookingData.notes || 'Booking created via n8n integration',
      hasPickupMeeting: bookingData.hasPickupMeeting || false,
      pickupLocation: bookingData.pickupLocation || '',
      specialRequests: bookingData.specialRequests || ''
    });
    
    return res.status(201).json({ 
      success: true, 
      message: 'Booking created successfully',
      data: booking
    });
  } catch (error: any) {
    console.error('Error processing n8n booking request:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'An error occurred processing the booking request'
    });
  }
});

/**
 * Check vehicle availability for a specific time period
 * This endpoint allows the n8n AI agent to check if a vehicle is available
 */
router.get('/vehicle-availability', async (req, res) => {
  try {
    // Get query parameters
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : null;
    const vehicleId = req.query.vehicleId ? parseInt(req.query.vehicleId as string) : null;
    const category = req.query.category as string;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Both startDate and endDate are required'
      });
    }
    
    let availableVehicles = await storage.getAvailableVehicles(startDate, endDate);
    
    // Filter by category if provided
    if (category) {
      availableVehicles = availableVehicles.filter(v => v.category === category);
    }
    
    // Check specific vehicle if vehicleId is provided
    if (vehicleId) {
      const isAvailable = availableVehicles.some(v => v.id === vehicleId);
      return res.status(200).json({
        success: true,
        available: isAvailable,
        message: isAvailable ? 'Vehicle is available for the requested period' : 'Vehicle is not available for the requested period',
        vehicle: isAvailable ? availableVehicles.find(v => v.id === vehicleId) : null
      });
    }
    
    return res.status(200).json({
      success: true,
      availableVehicles,
      count: availableVehicles.length,
      message: availableVehicles.length > 0 ? 'Available vehicles found' : 'No vehicles available for the requested period'
    });
  } catch (error: any) {
    console.error('Error checking vehicle availability:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'An error occurred checking vehicle availability'
    });
  }
});

/**
 * Schedule a pickup meeting for a booking
 * This endpoint allows the n8n AI agent to schedule pickup meetings
 */
router.post('/schedule-pickup', async (req, res) => {
  try {
    const { bookingId, bookingRef, pickupDate, pickupLocation, notes } = req.body;
    
    if (!bookingId && !bookingRef) {
      return res.status(400).json({
        success: false,
        message: 'Either bookingId or bookingRef is required'
      });
    }
    
    // Find the booking by ID or reference
    let booking;
    if (bookingId) {
      booking = await storage.getBooking(bookingId);
    } else {
      booking = await storage.getBookingByRef(bookingRef);
    }
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Update the booking with pickup meeting details
    const updatedBooking = await storage.updateBookingStatus(booking.id, booking.status);
    
    // Create a support ticket for the pickup meeting
    const supportTicket = await storage.createSupportTicket({
      customerId: booking.customerId,
      subject: `Pickup Meeting for Booking ${booking.bookingRef}`,
      description: notes || 'Scheduled pickup meeting',
      status: 'open',
      priority: 'medium',
      bookingId: booking.id,
      assignedTo: null,
      attachments: null
    });
    
    return res.status(200).json({
      success: true,
      message: 'Pickup meeting scheduled successfully',
      booking: updatedBooking,
      supportTicket
    });
  } catch (error: any) {
    console.error('Error scheduling pickup meeting:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'An error occurred scheduling the pickup meeting'
    });
  }
});

/**
 * Test endpoint for n8n connection
 */
router.get('/test', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'n8n connection is working',
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
    
    // Send data to n8n via HTTP request
    console.log(`Sending data to n8n at URL: ${url}`);
    console.log('Data being sent:', data);
    
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