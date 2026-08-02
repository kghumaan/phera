// Analytics utility for tracking agent interactions
// This can be connected to Plausible, Google Analytics, or other analytics services

export interface AgentInteractionEvent {
  agent_id: string;
  action_type: 'card_click' | 'modal_open' | 'waitlist_signup' | 'preorder_signup' | 'learn_more_click';
  cta_type?: 'waitlist' | 'pre-order' | 'learn-more';
  timestamp: Date;
}

class Analytics {
  private isEnabled: boolean;

  constructor() {
    // Check if analytics is enabled (can be controlled by environment variable)
    this.isEnabled = typeof window !== 'undefined' && process.env.NODE_ENV === 'production';
  }

  /**
   * Track agent interaction events
   */
  trackAgentInteraction(event: Omit<AgentInteractionEvent, 'timestamp'>) {
    if (!this.isEnabled) {
      console.log('[Analytics] Agent Interaction:', event);
      return;
    }

    const fullEvent: AgentInteractionEvent = {
      ...event,
      timestamp: new Date(),
    };

    // Send to analytics service (Plausible example)
    if (typeof window !== 'undefined' && (window as any).plausible) {
      (window as any).plausible('Agent Interaction', {
        props: {
          agent_id: fullEvent.agent_id,
          action_type: fullEvent.action_type,
          cta_type: fullEvent.cta_type || 'none',
        },
      });
    }

    // Google Analytics example
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'agent_interaction', {
        agent_id: fullEvent.agent_id,
        action_type: fullEvent.action_type,
        cta_type: fullEvent.cta_type || 'none',
      });
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics] Agent Interaction:', fullEvent);
    }
  }

  /**
   * Track page views
   */
  trackPageView(page: string) {
    if (!this.isEnabled) return;

    if (typeof window !== 'undefined' && (window as any).plausible) {
      (window as any).plausible('pageview', { props: { page } });
    }

    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'page_view', { page_path: page });
    }
  }

  /**
   * Track conversions (waitlist/pre-order signups)
   */
  trackConversion(type: 'waitlist' | 'preorder', agent_id: string) {
    if (!this.isEnabled) {
      console.log('[Analytics] Conversion:', { type, agent_id });
      return;
    }

    if (typeof window !== 'undefined' && (window as any).plausible) {
      (window as any).plausible('Agent Signup', {
        props: {
          type,
          agent_id,
        },
      });
    }

    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'conversion', {
        send_to: 'AW-CONVERSION_ID', // Replace with actual conversion ID
        value: type === 'preorder' ? 10 : 0,
        currency: 'USD',
        transaction_id: `${type}_${agent_id}_${Date.now()}`,
      });
    }

    console.log('[Analytics] Conversion tracked:', { type, agent_id });
  }
}

// Export singleton instance
export const analytics = new Analytics();

// Helper functions for easy use
export const trackWaitlistSignup = (agent_id: string) => {
  analytics.trackAgentInteraction({
    agent_id,
    action_type: 'waitlist_signup',
  });
  analytics.trackConversion('waitlist', agent_id);
};

export const trackPreorderSignup = (agent_id: string) => {
  analytics.trackAgentInteraction({
    agent_id,
    action_type: 'preorder_signup',
  });
  analytics.trackConversion('preorder', agent_id);
};

