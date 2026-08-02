/**
 * WhatsApp Business API Integration
 * Export all WhatsApp-related utilities
 */

export { whatsappClient, WhatsAppClient } from './client';
export {
  replaceParameters,
  formatParametersForAPI,
  validateTemplateParams,
  escapeWhatsAppText,
  TEMPLATE_PARAMS,
  type TemplateParameters,
} from './templates';
export {
  createOptIn,
  checkOptInStatus,
  getOptInPhone,
  handleOptOut,
  type WhatsAppOptIn,
} from './opt-ins';
