/** When the player is asking for a person, not another FAQ. Pure — no I/O. */

const LIVE =
  /\b(live agent|human agent|real (person|human|agent)|talk to (a )?(human|person|someone|agent)|speak to (a )?(human|person|agent)|operatore|persona reale|supporto (umano|live)|parlare con (un |qualcuno|una persona)|agente (reale|umano|live)|umano)\b/i;

export function wantsLiveAgent(text: string): boolean {
  return LIVE.test(text);
}

export type EscalateArgs = { reason: string; priority: "normal" | "high" };

export function parseEscalateArgs(raw: unknown): EscalateArgs {
  let value = raw;
  if (typeof raw === "string") {
    try {
      value = JSON.parse(raw);
    } catch {
      value = {};
    }
  }
  const obj = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const reason = String(obj.reason ?? "Player asked for a live agent").slice(0, 240);
  const priority = obj.priority === "high" ? "high" : "normal";
  return { reason, priority };
}

export const ESCALATE_TOOL = {
  type: "function" as const,
  function: {
    name: "escalate_to_live_agent",
    description:
      "Hand this ticket to a real human support agent on the TOLS governance desk. Use when the player asks for a person, or the case needs an operator (stuck withdrawal, missing deposit, locked account, KYC, takeover, bonus dispute).",
    parameters: {
      type: "object",
      properties: {
        reason: { type: "string", description: "One line the agent will see." },
        priority: { type: "string", enum: ["normal", "high"] },
      },
      required: ["reason"],
    },
  },
};
