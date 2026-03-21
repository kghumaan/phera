/**
 * WhatsApp Business Profile management — configure branded profile for each wedding.
 */

export interface BusinessProfileConfig {
  displayName: string;
  about: string;
  profilePhotoUrl?: string;
  websiteUrl?: string;
  description: string;
}

/**
 * Generate profile config from wedding data.
 */
export function generateProfileConfig(weddingData: {
  coupleName1: string;
  coupleName2: string;
  weddingDate: string;
  venue?: string;
  photoUrl?: string;
  websiteUrl?: string;
}): BusinessProfileConfig {
  const { coupleName1, coupleName2, weddingDate, venue, photoUrl, websiteUrl } = weddingData;

  // Display name: max 25 chars, no individual full names per Meta rules
  let displayName = `${coupleName1} & ${coupleName2} Wedding`;
  if (displayName.length > 25) {
    displayName = `${coupleName1} & ${coupleName2}`;
    if (displayName.length > 25) {
      displayName = displayName.substring(0, 25);
    }
  }

  return {
    displayName,
    about: `Wedding coordination for ${coupleName1} & ${coupleName2}'s celebration`,
    profilePhotoUrl: photoUrl,
    websiteUrl,
    description: `Official coordination channel for ${coupleName1} & ${coupleName2}'s wedding on ${weddingDate}${venue ? ` at ${venue}` : ''}. Powered by Phera.`,
  };
}

/**
 * Update WhatsApp Business profile via Meta API.
 * Note: Display name changes require Meta review (~2 days).
 */
export async function updateBusinessProfile(config: BusinessProfileConfig): Promise<void> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const apiVersion = process.env.WHATSAPP_API_VERSION || 'v23.0';

  if (!phoneNumberId || !accessToken) {
    throw new Error('Missing WhatsApp credentials');
  }

  const payload: Record<string, any> = {
    messaging_product: 'whatsapp',
    about: config.about,
    description: config.description,
  };

  if (config.websiteUrl) {
    payload.websites = [config.websiteUrl];
  }

  const response = await fetch(
    `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/whatsapp_business_profile`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to update profile: ${error.error?.message || response.statusText}`);
  }
}

/**
 * Get current WhatsApp Business profile.
 */
export async function getProfileStatus(): Promise<Record<string, any> | null> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const apiVersion = process.env.WHATSAPP_API_VERSION || 'v23.0';

  if (!phoneNumberId || !accessToken) return null;

  const response = await fetch(
    `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/whatsapp_business_profile?fields=about,description,vertical,email,websites,profile_picture_url`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) return null;
  const data = await response.json();
  return data.data?.[0] || null;
}
