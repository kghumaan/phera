/**
 * Escalation hand-off: a stressed couple asks for a human. The agent must
 * route it to the team via submit_request (kind 'support') and promise a
 * follow-up — never claim it resolved the family conflict itself, and never
 * fake automation.
 */
export default {
  name: 'escalation-handoff',
  description: 'Populated wedding: "can I talk to a person?" → submit_request(support), honest hand-off',
  persona: 'E10', // out-of-scope / human-judgment ask — route to the team, never fake it
  seed: 'populated',
  turns: [
    {
      message:
        'Honestly this is stressful — my mother-in-law keeps fighting us on the guest list. Can I just talk to a person at Phera?',
      expect: {
        tools: ['submit_request'],
        reply: ['team|someone|a (real )?(person|human)', 'follow.?up|reach out|in touch|get back|contact'],
        replyNot: ["I('|’)ve (resolved|fixed|sorted)", 'automatically'],
      },
      // planner_requests isn't in the lab state dump — assert the hand-off
      // via the audited agent_actions row instead.
      verify: async (state) => {
        const action = state.agent.actions.find((a) => a.tool_name === 'submit_request');
        return [
          {
            label: "submit_request audited with kind 'support'",
            pass: action?.input?.kind === 'support',
            detail: JSON.stringify(action?.input ?? null),
          },
        ];
      },
    },
  ],
};
