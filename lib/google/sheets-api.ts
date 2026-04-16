import { google } from 'googleapis';
import { getAuthClient } from './auth';

export class GoogleSheetsService {
  private sheets;
  private spreadsheetId: string;

  constructor(spreadsheetId: string) {
    this.spreadsheetId = spreadsheetId;
    this.sheets = google.sheets('v4');
  }

  // Read RSVP data from a specific range
  async readRSVPData(range: string) {
    try {
      const auth = await getAuthClient();
      const response = await this.sheets.spreadsheets.values.get({
        auth,
        spreadsheetId: this.spreadsheetId,
        range,
      });

      return response.data.values || [];
    } catch (error) {
      console.error('Error reading RSVP data:', error);
      throw new Error('Failed to read RSVP data');
    }
  }

  // Append new RSVP entry
  async appendRSVPEntry(range: string, values: any[]) {
    try {
      const auth = await getAuthClient();
      const response = await this.sheets.spreadsheets.values.append({
        auth,
        spreadsheetId: this.spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [values],
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error appending RSVP entry:', error);
      throw new Error('Failed to append RSVP entry');
    }
  }

  // Update existing RSVP entry
  async updateRSVPEntry(range: string, values: any[]) {
    try {
      const auth = await getAuthClient();
      const response = await this.sheets.spreadsheets.values.update({
        auth,
        spreadsheetId: this.spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [values],
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error updating RSVP entry:', error);
      throw new Error('Failed to update RSVP entry');
    }
  }

  // Get guest list analytics
  async getGuestAnalytics() {
    try {
      const auth = await getAuthClient();
      const response = await this.sheets.spreadsheets.values.batchGet({
        auth,
        spreadsheetId: this.spreadsheetId,
        ranges: ['RSVPs!A:Z', 'Analytics!A:Z'],
      });

      return {
        rsvpData: response.data.valueRanges?.[0].values || [],
        analyticsData: response.data.valueRanges?.[1].values || [],
      };
    } catch (error) {
      console.error('Error fetching guest analytics:', error);
      throw new Error('Failed to fetch guest analytics');
    }
  }
} 