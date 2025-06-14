import { google } from 'googleapis';
import { getAuthClient } from './auth';
import { forms_v1 } from 'googleapis';

export class GoogleFormsService {
  private forms: forms_v1.Forms;
  private formId: string;

  constructor(formId: string) {
    this.formId = formId;
    this.forms = google.forms('v1');
  }

  // Get form details and embed URL
  async getFormDetails() {
    try {
      const auth = await getAuthClient();
      const response = await this.forms.forms.get({
        auth,
        formId: this.formId,
      });

      const formInfo = response.data.info;
      return {
        title: formInfo?.title || '',
        description: formInfo?.description || '',
        embedUrl: `https://docs.google.com/forms/d/e/${this.formId}/viewform?embedded=true`,
      };
    } catch (error) {
      console.error('Error fetching form details:', error);
      throw new Error('Failed to fetch form details');
    }
  }

  // Get form responses
  async getResponses() {
    try {
      const auth = await getAuthClient();
      const response = await this.forms.forms.responses.list({
        auth,
        formId: this.formId,
      });

      return response.data.responses || [];
    } catch (error) {
      console.error('Error fetching form responses:', error);
      throw new Error('Failed to fetch form responses');
    }
  }

  // Create a new form
  async createForm(title: string, description: string) {
    try {
      const auth = await getAuthClient();
      const response = await this.forms.forms.create({
        auth,
        requestBody: {
          info: {
            title,
            description,
          },
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error creating form:', error);
      throw new Error('Failed to create form');
    }
  }
} 