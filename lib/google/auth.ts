import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

// Initialize auth client with service account
export const getAuthClient = async () => {
  try {
    const auth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: [
        'https://www.googleapis.com/auth/forms',
        'https://www.googleapis.com/auth/spreadsheets',
      ],
    });

    await auth.authorize();
    return auth;
  } catch (error) {
    console.error('Error initializing Google auth client:', error);
    throw new Error('Failed to initialize Google authentication');
  }
};

// Helper to check if auth is valid
export const isAuthValid = (auth: JWT) => {
  return auth.credentials && !auth.credentials.expiry_date;
}; 