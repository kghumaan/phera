/**
 * WhatsApp Template Utilities
 * Handles template parameter replacement and validation
 */

export interface TemplateParameters {
  [key: string]: string;
}

/**
 * Template definitions mapping parameter keys to their positions
 */
export const TEMPLATE_PARAMS: Record<string, string[]> = {
  rsvp_confirmation: ['guest_name', 'couple_names', 'wedding_date'],
  event_reminder: ['guest_name', 'event_name', 'event_time', 'venue_name'],
  shuttle_reminder: ['guest_name', 'departure_time', 'pickup_location'],
  venue_update: ['guest_name', 'event_name', 'new_venue', 'new_address'],
  photo_sharing: ['guest_name', 'event_name', 'photo_link'],
};

/**
 * Replace template parameters ({{1}}, {{2}}, etc.) with actual values
 * @param template - Template string with {{N}} placeholders
 * @param params - Object mapping parameter names to values
 * @param templateName - Name of the template for parameter ordering
 * @returns Template string with parameters replaced
 */
export function replaceParameters(
  template: string,
  params: TemplateParameters,
  templateName?: string
): string {
  let result = template;

  if (templateName && TEMPLATE_PARAMS[templateName]) {
    // Replace using defined parameter order
    const paramKeys = TEMPLATE_PARAMS[templateName];
    paramKeys.forEach((key, index) => {
      const placeholder = `{{${index + 1}}}`;
      const value = params[key] || '';
      result = result.replace(new RegExp(placeholder, 'g'), value);
    });
  } else {
    // Fallback: replace by parameter order in object
    const values = Object.values(params);
    values.forEach((value, index) => {
      const placeholder = `{{${index + 1}}}`;
      result = result.replace(new RegExp(placeholder, 'g'), value);
    });
  }

  return result;
}

/**
 * Convert template parameters to WhatsApp API format (ordered array)
 * @param params - Object mapping parameter names to values
 * @param templateName - Name of the template for parameter ordering
 * @returns Array of parameter values in correct order
 */
export function formatParametersForAPI(
  params: TemplateParameters,
  templateName: string
): string[] {
  if (!TEMPLATE_PARAMS[templateName]) {
    throw new Error(`Unknown template: ${templateName}`);
  }

  const paramKeys = TEMPLATE_PARAMS[templateName];
  return paramKeys.map(key => {
    if (!(key in params)) {
      throw new Error(`Missing required parameter: ${key} for template ${templateName}`);
    }
    return params[key];
  });
}

/**
 * Validate that all required parameters are provided
 * @param templateName - Name of the template
 * @param params - Parameters to validate
 * @returns True if valid, throws error if invalid
 */
export function validateTemplateParams(
  templateName: string,
  params: TemplateParameters
): boolean {
  if (!TEMPLATE_PARAMS[templateName]) {
    throw new Error(`Unknown template: ${templateName}`);
  }

  const requiredParams = TEMPLATE_PARAMS[templateName];
  const missingParams = requiredParams.filter(param => !(param in params) || !params[param]);

  if (missingParams.length > 0) {
    throw new Error(
      `Missing required parameters for template "${templateName}": ${missingParams.join(', ')}`
    );
  }

  return true;
}

/**
 * Escape special characters for WhatsApp formatting
 * WhatsApp supports markdown-like formatting which needs to be escaped
 */
export function escapeWhatsAppText(text: string): string {
  // Escape characters that might be interpreted as formatting
  return text
    .replace(/\*/g, '\\*')  // Bold
    .replace(/_/g, '\\_')   // Italic
    .replace(/~/g, '\\~')   // Strikethrough
    .replace(/```/g, '\\```'); // Code
}
