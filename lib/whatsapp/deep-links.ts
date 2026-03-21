/**
 * wa.me deep link generation for personal-touch outreach.
 * Couple sends initial save-the-date from their own WhatsApp.
 */

export interface GuestContact {
  name: string;
  phone: string;
}

export interface WaLink {
  name: string;
  phone: string;
  link: string;
}

/**
 * Generate a wa.me deep link for a single guest.
 */
export function generateWaLink(guestPhone: string, message: string): string {
  const cleanPhone = guestPhone.replace(/[^0-9]/g, '');
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

/**
 * Generate wa.me links for multiple guests with personalized messages.
 */
export function generateBulkWaLinks(
  guests: GuestContact[],
  messageTemplate: string
): WaLink[] {
  return guests.map((guest) => {
    const personalizedMessage = messageTemplate.replace(/\{\{name\}\}/g, guest.name);
    return {
      name: guest.name,
      phone: guest.phone,
      link: generateWaLink(guest.phone, personalizedMessage),
    };
  });
}

/**
 * Generate the pre-written save-the-date message text.
 */
export function generateBroadcastMessage(
  coupleName: string,
  weddingDate: string,
  websiteUrl: string
): string {
  return `Hey! 🎉\n\nSave the date — ${coupleName} are getting married on ${weddingDate}!\n\nWe'd love for you to be there. Check out all the details here: ${websiteUrl}\n\nYou'll hear from our wedding coordination team (Phera) soon to help with RSVPs, travel, and everything else.\n\nCan't wait to celebrate with you! 💕`;
}
