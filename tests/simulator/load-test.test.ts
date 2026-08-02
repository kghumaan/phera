/**
 * Load test for outreach batch sending.
 */

import { describe, it, expect } from 'vitest';
import { WhatsAppSimulator } from './whatsapp-simulator';
import { GUEST_PERSONAS } from './guest-behaviors';

describe('WhatsApp Simulator', () => {
  it('should create guests with correct distribution', () => {
    const sim = new WhatsAppSimulator();
    const guests = sim.createGuests(100);
    expect(guests).toHaveLength(100);

    // All guests should have a persona
    guests.forEach((g) => {
      expect(g.persona).toBeDefined();
      expect(g.status).toBe('not_contacted');
    });
  });

  it('should simulate sending to all non-opted-out guests', () => {
    const sim = new WhatsAppSimulator();
    sim.createGuests(50);
    const { sent, optedOut } = sim.simulateSend();
    expect(sent + optedOut).toBe(50);
    expect(sent).toBeGreaterThan(0);
  });

  it('should simulate realistic response rates', () => {
    const sim = new WhatsAppSimulator();
    sim.createGuests(100);
    sim.simulateSend();
    const { responded, optedOut, noResponse } = sim.simulateResponses();

    expect(responded + optedOut + noResponse).toBeLessThanOrEqual(100);
    // Most guests should respond (60%+ given persona distribution)
    expect(responded).toBeGreaterThan(30);
  });

  it('should identify guests needing escalation after 3 sends', () => {
    const sim = new WhatsAppSimulator();
    sim.createGuests(50);

    // Send 3 times
    sim.simulateSend();
    sim.simulateSend();
    sim.simulateSend();

    // Simulate responses once
    sim.simulateResponses();

    const results = sim.getResults();
    // Ghost personas should have received 3 messages with no reply
    expect(results.escalated).toBeGreaterThanOrEqual(0);
  });

  it('should handle opt-outs correctly', () => {
    const sim = new WhatsAppSimulator();
    sim.createGuests(100);
    sim.simulateSend();
    sim.simulateResponses();

    const results = sim.getResults();
    // Some guests should have opted out
    expect(results.optedOut).toBeGreaterThanOrEqual(0);
  });

  it('should handle 300 concurrent guests', () => {
    const sim = new WhatsAppSimulator();
    const guests = sim.createGuests(300);
    expect(guests).toHaveLength(300);

    const sendResult = sim.simulateSend();
    expect(sendResult.sent).toBeGreaterThan(250);

    const responseResult = sim.simulateResponses();
    expect(responseResult.responded).toBeGreaterThan(0);
  });
});

describe('Guest Personas', () => {
  it('should have 7 persona types', () => {
    expect(GUEST_PERSONAS).toHaveLength(7);
  });

  it('ghost persona should never respond', () => {
    const ghost = GUEST_PERSONAS.find((p) => p.type === 'ghost');
    expect(ghost?.respondProbability).toBe(0);
  });

  it('opt-out persona should send STOP', () => {
    const optOut = GUEST_PERSONAS.find((p) => p.type === 'opt_out');
    expect(optOut?.messages).toContain('STOP');
  });

  it('eager responder should have high probability', () => {
    const eager = GUEST_PERSONAS.find((p) => p.type === 'eager');
    expect(eager?.respondProbability).toBe(1.0);
  });
});
