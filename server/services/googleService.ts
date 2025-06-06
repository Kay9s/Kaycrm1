import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { promises as fs } from 'fs';
import path from 'path';

const TOKENS_FILE = path.join(process.cwd(), 'google-tokens.json');

// Initialize Google OAuth client with all required scopes
const getRedirectUri = () => {
  if (process.env.REPLIT_DOMAINS) {
    const domain = process.env.REPLIT_DOMAINS.split(',')[0];
    return `https://${domain}/api/google/auth/callback`;
  }
  return 'http://localhost:5000/api/google/auth/callback';
};

const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  getRedirectUri()
);

// Load existing tokens on startup
async function loadStoredTokens() {
  try {
    const tokenData = await fs.readFile(TOKENS_FILE, 'utf8');
    const tokens = JSON.parse(tokenData);
    oauth2Client.setCredentials(tokens);
    console.log('Loaded stored Google tokens');
    return true;
  } catch (error) {
    console.log('No stored Google tokens found');
    return false;
  }
}

// Save tokens to file
async function saveTokens(tokens: any) {
  try {
    await fs.writeFile(TOKENS_FILE, JSON.stringify(tokens, null, 2));
    console.log('Google tokens saved to file');
  } catch (error) {
    console.error('Error saving Google tokens:', error);
  }
}

// Load tokens on module initialization
loadStoredTokens();

// Initialize Google API services
const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
const docs = google.docs({ version: 'v1', auth: oauth2Client });
const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

/**
 * Gets the authorization URL for all Google services
 */
export function getAuthUrl() {
  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/documents',
    'https://www.googleapis.com/auth/drive.file'
  ];

  const redirectUri = getRedirectUri();
  console.log('Using redirect URI:', redirectUri);

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
    redirect_uri: redirectUri
  });
}

/**
 * Handles the OAuth callback from Google
 */
export async function handleCallback(code: string) {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    await saveTokens(tokens);
    console.log('Google authentication completed and tokens saved');
    return tokens;
  } catch (error) {
    console.error('Error handling Google OAuth callback:', error);
    throw error;
  }
}

/**
 * Sets the OAuth tokens for the Google client
 */
export function setTokens(tokens: any) {
  oauth2Client.setCredentials(tokens);
}

/**
 * Checks if the Google client is authenticated
 */
export function isAuthenticated() {
  return !!oauth2Client.credentials.access_token;
}

/**
 * Calendar Functions
 */
export async function addBookingToCalendar(booking: any) {
  try {
    if (!oauth2Client.credentials.access_token) {
      throw new Error('Google services not authenticated');
    }

    const customerName = booking.customerName || booking.customer?.fullName || 'Customer';
    const vehicleInfo = booking.vehicleInfo || 
      (booking.vehicle ? `${booking.vehicle.make} ${booking.vehicle.model}` : 'Vehicle');
    
    const startDate = new Date(booking.startDate);
    const endDate = new Date(booking.endDate);

    const event = {
      summary: `Car Rental: ${customerName}`,
      description: `Booking Reference: ${booking.bookingRef}\nVehicle: ${vehicleInfo}\nStatus: ${booking.status || 'Confirmed'}`,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: 'UTC',
      },
      colorId: '1',
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 60 },
        ],
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });

    return response.data.id || null;
  } catch (error) {
    console.error('Error adding booking to Google Calendar:', error);
    throw error;
  }
}

/**
 * Sheets Functions
 */
export async function createReportSheet(title: string, data: any[]) {
  try {
    if (!oauth2Client.credentials.access_token) {
      throw new Error('Google services not authenticated');
    }

    // Create new spreadsheet
    const spreadsheet = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: title
        }
      }
    });

    const spreadsheetId = spreadsheet.data.spreadsheetId!;

    // Add data to the sheet
    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      const values = [
        headers,
        ...data.map(row => headers.map(header => row[header] || ''))
      ];

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'A1',
        valueInputOption: 'RAW',
        requestBody: {
          values
        }
      });
    }

    return {
      spreadsheetId,
      url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`
    };
  } catch (error) {
    console.error('Error creating Google Sheet:', error);
    throw error;
  }
}

/**
 * Docs Functions
 */
export async function createReportDocument(title: string, content: string) {
  try {
    if (!oauth2Client.credentials.access_token) {
      throw new Error('Google services not authenticated');
    }

    // Create new document
    const doc = await docs.documents.create({
      requestBody: {
        title: title
      }
    });

    const documentId = doc.data.documentId!;

    // Add content to the document
    if (content) {
      await docs.documents.batchUpdate({
        documentId,
        requestBody: {
          requests: [
            {
              insertText: {
                location: {
                  index: 1
                },
                text: content
              }
            }
          ]
        }
      });
    }

    return {
      documentId,
      url: `https://docs.google.com/document/d/${documentId}`
    };
  } catch (error) {
    console.error('Error creating Google Doc:', error);
    throw error;
  }
}

/**
 * Gmail Functions
 */
export async function sendEmail(to: string, subject: string, htmlContent: string) {
  try {
    if (!oauth2Client.credentials.access_token) {
      throw new Error('Google services not authenticated');
    }

    const message = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'Content-Type: text/html; charset=utf-8',
      '',
      htmlContent
    ].join('\n');

    const encodedMessage = Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');

    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    });

    return response.data.id;
  } catch (error) {
    console.error('Error sending email via Gmail:', error);
    throw error;
  }
}

/**
 * Sync booking data to Google Calendar
 */
export async function syncCalendar(bookings: any[]) {
  try {
    if (!oauth2Client.credentials.access_token) {
      throw new Error('Google services not authenticated');
    }

    const results = [];
    for (const booking of bookings) {
      try {
        const eventId = await addBookingToCalendar(booking);
        results.push({ bookingId: booking.id, eventId, success: true });
      } catch (error) {
        results.push({ bookingId: booking.id, error: error.message, success: false });
      }
    }

    return results;
  } catch (error) {
    console.error('Error syncing calendar:', error);
    throw error;
  }
}