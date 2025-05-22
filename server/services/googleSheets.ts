import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

// Initialize Google OAuth client
const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:5000/api/google/callback'
);

// Set up the Sheets API service
const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

/**
 * Create a new Google Sheet for bookings report
 * @param title The title of the new sheet
 * @returns The ID of the new sheet
 */
export async function createBookingsSheet(title: string): Promise<string | null> {
  try {
    if (!oauth2Client.credentials.access_token) {
      console.error('Google Sheets not authenticated');
      return null;
    }

    // Create a new spreadsheet
    const response = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title,
        },
        sheets: [
          {
            properties: {
              title: 'Bookings',
              gridProperties: {
                rowCount: 1000,
                columnCount: 10,
              },
            },
          },
        ],
      },
    });

    const spreadsheetId = response.data.spreadsheetId;
    console.log('Spreadsheet created with ID:', spreadsheetId);
    
    // If we got a spreadsheet ID, set up header row
    if (spreadsheetId) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetId,
        range: 'Bookings!A1:J1',
        valueInputOption: 'RAW',
        requestBody: {
          values: [
            [
              'Booking Ref', 
              'Customer', 
              'Vehicle', 
              'Start Date', 
              'End Date', 
              'Status', 
              'Payment Status', 
              'Total Amount', 
              'Created At', 
              'Notes'
            ],
          ],
        },
      });

      // Format header row
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: spreadsheetId,
        requestBody: {
          requests: [
            {
              repeatCell: {
                range: {
                  sheetId: 0,
                  startRowIndex: 0,
                  endRowIndex: 1,
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: {
                      red: 0.2,
                      green: 0.2,
                      blue: 0.8,
                    },
                    textFormat: {
                      foregroundColor: {
                        red: 1.0,
                        green: 1.0,
                        blue: 1.0,
                      },
                      bold: true,
                    },
                  },
                },
                fields: 'userEnteredFormat(backgroundColor,textFormat)',
              },
            },
          ],
        },
      });
    }

    return spreadsheetId || null;
  } catch (error) {
    console.error('Error creating Google Sheet:', error);
    return null;
  }
}

/**
 * Add bookings data to a Google Sheet
 * @param spreadsheetId The ID of the spreadsheet
 * @param bookings The bookings data to add
 * @returns True if successful, false otherwise
 */
export async function addBookingsToSheet(spreadsheetId: string, bookings: any[]): Promise<boolean> {
  try {
    if (!oauth2Client.credentials.access_token) {
      console.error('Google Sheets not authenticated');
      return false;
    }

    if (!spreadsheetId || !bookings.length) {
      console.error('Missing spreadsheet ID or bookings data');
      return false;
    }

    // Prepare the data rows
    const rows = bookings.map(booking => [
      booking.bookingRef,
      booking.customerName || `ID: ${booking.customerId}`,
      booking.vehicleInfo || `ID: ${booking.vehicleId}`,
      new Date(booking.startDate).toLocaleDateString(),
      new Date(booking.endDate).toLocaleDateString(),
      booking.status,
      booking.paymentStatus,
      booking.totalAmount ? `$${booking.totalAmount.toFixed(2)}` : '$0.00',
      new Date(booking.createdAt).toLocaleString(),
      booking.notes || '',
    ]);

    // Append the data to the sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Bookings!A2',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: rows,
      },
    });

    console.log(`Added ${bookings.length} bookings to Google Sheet`);
    return true;
  } catch (error) {
    console.error('Error adding bookings to Google Sheet:', error);
    return false;
  }
}

/**
 * Gets the authorization URL for Google Sheets
 * @returns The authorization URL
 */
export function getAuthUrl(): string {
  const scopes = [
    'https://www.googleapis.com/auth/spreadsheets',
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
export async function handleCallback(code: string): Promise<any> {
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
export function setTokens(tokens: any): void {
  oauth2Client.setCredentials(tokens);
}

/**
 * Checks if the Google client is authenticated
 * @returns True if authenticated, false otherwise
 */
export function isAuthenticated(): boolean {
  return !!oauth2Client.credentials.access_token;
}