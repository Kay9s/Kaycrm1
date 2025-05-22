import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

// Initialize Google OAuth client
const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  // This should be your redirect URL in a production environment
  'http://localhost:5000/api/google/callback'
);

// Set up the Calendar API service
const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

/**
 * Adds a booking to Google Calendar
 * @param booking The booking to add to Google Calendar
 * @returns The Google Calendar event ID
 */
export async function addBookingToCalendar(booking: any) {
  try {
    if (!oauth2Client.credentials.access_token) {
      console.error('Google Calendar not authenticated');
      return null;
    }

    const customerName = booking.customerName || 'Customer';
    const vehicleInfo = booking.vehicleInfo || 'Vehicle';
    
    // Format dates for Google Calendar
    const startDate = new Date(booking.startDate);
    const endDate = new Date(booking.endDate);

    // Create the event
    const event = {
      summary: `Car Rental: ${customerName}`,
      description: `Booking Reference: ${booking.bookingRef}\nVehicle: ${vehicleInfo}`,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: 'UTC',
      },
      colorId: '1', // Blue
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 60 }, // 1 hour before
        ],
      },
    };

    // Add the event to Google Calendar
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });

    console.log('Event created: %s', response.data.htmlLink);
    return response.data.id || null;
  } catch (error) {
    console.error('Error adding booking to Google Calendar:', error);
    return null;
  }
}

/**
 * Updates a booking in Google Calendar
 * @param booking The booking to update
 * @param eventId The Google Calendar event ID
 * @returns True if successful, false otherwise
 */
export async function updateCalendarEvent(booking: any, eventId: string) {
  try {
    if (!oauth2Client.credentials.access_token) {
      console.error('Google Calendar not authenticated');
      return false;
    }

    if (!eventId) {
      console.error('No event ID provided');
      return false;
    }

    const customerName = booking.customerName || 'Customer';
    const vehicleInfo = booking.vehicleInfo || 'Vehicle';
    
    // Format dates for Google Calendar
    const startDate = new Date(booking.startDate);
    const endDate = new Date(booking.endDate);

    // Get the current event
    const currentEvent = await calendar.events.get({
      calendarId: 'primary',
      eventId: eventId,
    });

    // Update the event
    const event = {
      summary: `Car Rental: ${customerName}`,
      description: `Booking Reference: ${booking.bookingRef}\nVehicle: ${vehicleInfo}\nStatus: ${booking.status}`,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: 'UTC',
      },
      // Maintain original color unless status changed
      colorId: booking.status === 'cancelled' ? '11' : // Red if cancelled
               booking.status === 'completed' ? '9' : // Green if completed
               '1', // Blue for active/pending
    };

    // Update the event in Google Calendar
    const response = await calendar.events.update({
      calendarId: 'primary',
      eventId: eventId,
      requestBody: {
        ...currentEvent.data,
        ...event,
      },
    });

    console.log('Event updated: %s', response.data.htmlLink);
    return true;
  } catch (error) {
    console.error('Error updating Google Calendar event:', error);
    return false;
  }
}

/**
 * Cancels a booking in Google Calendar
 * @param eventId The Google Calendar event ID
 * @returns True if successful, false otherwise
 */
export async function cancelCalendarEvent(eventId: string) {
  try {
    if (!oauth2Client.credentials.access_token) {
      console.error('Google Calendar not authenticated');
      return false;
    }

    if (!eventId) {
      console.error('No event ID provided');
      return false;
    }

    // Delete the event from Google Calendar
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
    });

    console.log('Event deleted:', eventId);
    return true;
  } catch (error) {
    console.error('Error cancelling Google Calendar event:', error);
    return false;
  }
}

/**
 * Gets the authorization URL for Google Calendar
 * @returns The authorization URL
 */
export function getAuthUrl() {
  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent', // Forces to approve the consent screen
  });
}

/**
 * Handles the OAuth callback from Google
 * @param code The authorization code from Google
 * @returns The tokens
 */
export async function handleCallback(code: string) {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    return tokens;
  } catch (error) {
    console.error('Error handling Google OAuth callback:', error);
    throw error;
  }
}

/**
 * Sets the OAuth tokens for the Google client
 * @param tokens The OAuth tokens
 */
export function setTokens(tokens: any) {
  oauth2Client.setCredentials(tokens);
}

/**
 * Checks if the Google client is authenticated
 * @returns True if authenticated, false otherwise
 */
export function isAuthenticated() {
  return !!oauth2Client.credentials.access_token;
}