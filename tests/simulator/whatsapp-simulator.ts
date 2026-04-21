/**
 * WhatsApp conversation simulator for testing outreach flows.
 */

import { GUEST_PERSONAS, GuestPersona } from './guest-behaviors';

export interface SimulatedGuest {
  id: string;
  name: string;
  phone: string;
  persona: GuestPersona;
  status: string;
  messagesReceived: number;
  messagesReplied: number;
  optedOut: boolean;
}

export interface SimulationResult {
  totalGuests: number;
  responded: number;
  optedOut: number;
  escalated: number;
  rsvpConfirmed: number;
  travelCollected: number;
  averageResponseTime: number;
}

export class WhatsAppSimulator {
  private guests: SimulatedGuest[] = [];

  /**
   * Create simulated guests with realistic persona distribution.
   */
  createGuests(count: number): SimulatedGuest[] {
    this.guests = [];

    // Distribution: 60% eager/busy, 25% need nudges, 10% hard, 5% ghost
    for (let i = 0; i < count; i++) {
      const rand = Math.random();
      let persona: GuestPersona;

      if (rand < 0.35) {
        persona = GUEST_PERSONAS.find((p) => p.type === 'eager')!;
      } else if (rand < 0.6) {
        persona = GUEST_PERSONAS.find((p) => p.type === 'busy')!;
      } else if (rand < 0.75) {
        persona = GUEST_PERSONAS.find((p) => p.type === 'tech_averse')!;
      } else if (rand < 0.85) {
        persona = GUEST_PERSONAS.find((p) => p.type === 'international')!;
      } else if (rand < 0.9) {
        persona = GUEST_PERSONAS.find((p) => p.type === 'liaison')!;
      } else if (rand < 0.95) {
        persona = GUEST_PERSONAS.find((p) => p.type === 'ghost')!;
      } else {
        persona = GUEST_PERSONAS.find((p) => p.type === 'opt_out')!;
      }

      this.guests.push({
        id: `sim-guest-${i}`,
        name: `Guest ${i + 1}`,
        phone: `+9198765${String(i).padStart(5, '0')}`,
        persona,
        status: 'not_contacted',
        messagesReceived: 0,
        messagesReplied: 0,
        optedOut: false,
      });
    }

    return this.guests;
  }

  /**
   * Simulate sending a template to all eligible guests.
   */
  simulateSend(): { sent: number; optedOut: number; failed: number } {
    let sent = 0;
    let optedOut = 0;
    let failed = 0;

    for (const guest of this.guests) {
      if (guest.optedOut) {
        optedOut++;
        continue;
      }
      guest.messagesReceived++;
      sent++;
    }

    return { sent, optedOut, failed };
  }

  /**
   * Simulate guest responses based on personas.
   */
  simulateResponses(): { responded: number; optedOut: number; noResponse: number } {
    let responded = 0;
    let optedOut = 0;
    let noResponse = 0;

    for (const guest of this.guests) {
      if (guest.optedOut) continue;

      if (guest.persona.type === 'opt_out') {
        guest.optedOut = true;
        optedOut++;
        continue;
      }

      if (Math.random() < guest.persona.respondProbability) {
        guest.messagesReplied++;
        guest.status = 'rsvp_confirmed';
        responded++;
      } else {
        noResponse++;
      }
    }

    return { responded, optedOut, noResponse };
  }

  /**
   * Get simulation results.
   */
  getResults(): SimulationResult {
    return {
      totalGuests: this.guests.length,
      responded: this.guests.filter((g) => g.messagesReplied > 0).length,
      optedOut: this.guests.filter((g) => g.optedOut).length,
      escalated: this.guests.filter(
        (g) => g.messagesReceived >= 3 && g.messagesReplied === 0 && !g.optedOut
      ).length,
      rsvpConfirmed: this.guests.filter((g) => g.status === 'rsvp_confirmed').length,
      travelCollected: this.guests.filter((g) => g.status === 'travel_collected').length,
      averageResponseTime: 0, // Would be calculated from timestamps in real sim
    };
  }
}
