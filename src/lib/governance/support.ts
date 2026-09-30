import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { env } from "@/lib/env.server";
import { pushBridgeEventInner } from "@/lib/governance/bridge";
import { ESCALATE_TOOL, parseEscalateArgs, wantsLiveAgent } from "@/lib/governance/support-policy";

type Role = "user" | "assistant" | "agent" | "system";
type Status = "ai" | "live" | "closed";

type ThreadRow = {
  id: string;
  user_id: string;
  user_name: string | null;
  user_email: string | null;
  status: string;
  agent_name: string | null;
};

type MsgRow = { id: string | number; role: string; body: string; created_at: string };

export type SupportMessage = { id: string; role: Role; body: string; at: string };

export type SupportView = {
  ok: boolean;
  error?: string;
  status: Status;
  agentName: string | null;
  ai: boolean;
  desk: "idle" | "sent" | "queued";
  messages: SupportMessage[];
};

const SYSTEM = `You are TOLS Support, first line for tols.fun.
Rules:
- Reply in the player's language. Two or three short sentences. No markdown headings.
- How-to: deposits are in Wallet. Originals settle on the server (Provably Fair). Limits and self-exclusion are under Profile → Responsible play. Gambling harm: BeGambleAware and the Responsible play page. Written record: support@tols.fun.
- Never invent a balance, bet id, KYC status, or promise a payout. Never ask for a password, seed phrase, or 2FA code. Do not tell them to chase losses.
- Call escalate_to_live_agent when they ask for a human, or an operator must act: stuck withdrawal, deposit not credited, locked account, KYC review, suspected takeover, bonus dispute. Then tell them a live agent on the governance desk has the ticket.
- Do not call the tool for ordinary how-to questions.`;

function asStatus(v: string): Status {
  if (v === "live" || v === "closed") return v;
  return "ai";
}

function asRole(v: string): Role {
  if (v === "user" || v === "assistant" || v === "agent" || v === "system") return v;
  return "system";
}

function viewOf(
  thread: ThreadRow | null,
  rows: MsgRow[],
  extra: Partial<Pick<SupportView, "ok" | "error" | "desk">> = {},
): SupportView {
  return {
    ok: extra.ok ?? true,
    error: extra.error,
    status: asStatus(thread?.status ?? "ai"),
    agentName: thread?.agent_name ?? null,
    ai: Boolean(env("XAI_API_KEY")),
    desk: extra.desk ?? "idle",
    messages: rows.map((r) => ({
      id: String(r.id),
      role: asRole(r.role),
      body: r.body,
      at: r.created_at,
    })),
  };
}

async function loadMessages(threadId: string): Promise<MsgRow[]> {
  const sql = await getSql();
  return sql<MsgRow>`
    select id::text as id, role, body, created_at::text as created_at
    from support_messages
    where thread_id = ${threadId}
    order by id asc
    limit 80
  `;
}

async function ensureThread(userId: string, email: string | null): Promise<ThreadRow> {
  const sql = await getSql();
  const existing = await sql<ThreadRow>`
    select id, user_id, user_name, user_email, status, agent_name
    from support_threads where user_id = ${userId} limit 1
  `;
  if (existing[0]) {
    if (email && existing[0].user_email !== email) {
      await sql`update support_threads set user_email = ${email}, updated_at = now() where id = ${existing[0].id}`;
      existing[0].user_email = email;
    }
    return existing[0];
  }
  const named = await sql<{ name: string | null; email: string | null }>`
    select name, email from "user" where id = ${userId} limit 1
  `.catch(() => [] as { name: string | null; email: string | null }[]);
  const id = crypto.randomUUID();
  const name = named[0]?.name?.trim() || null;
  const mail = email || named[0]?.email || null;
  await sql`
    insert into support_threads (id, user_id, user_name, user_email)
    values (${id}, ${userId}, ${name}, ${mail})
  `;
  return { id, user_id: userId, user_name: name, user_email: mail, status: "ai", agent_name: null };
}

async function insertMessage(threadId: string, userId: string, role: Role, body: string) {
  const sql = await getSql();
  await sql`
    insert into support_messages (thread_id, user_id, role, body)
    values (${threadId}, ${userId}, ${role}, ${body})
  `;
  await sql`update support_threads set updated_at = now() where id = ${threadId}`;
}

async function setStatus(thread: ThreadRow, status: Status, reason?: string, agentName?: string | null) {
  const sql = await getSql();
  await sql`
    update support_threads set
      status = ${status},
      escalate_reason = coalesce(${reason ?? null}, escalate_reason),
      agent_name = coalesce(${agentName ?? null}, agent_name),
      updated_at = now()
    where id = ${thread.id}
  `;
  thread.status = status;
  if (agentName) thread.agent_name = agentName;
}

async function pushDesk(type: "casino.support_ticket" | "casino.support_message", payload: Record<string, unknown>) {
  try {
    const res = await pushBridgeEventInner(type, payload);
    return res.ok ? ("sent" as const) : ("queued" as const);
  } catch {
    return "queued" as const;
  }
}

function handoffNote(desk: "sent" | "queued", sample: string) {
  const it = /\b(il|lo|la|un|una|che|per|voglio|prelievo|aiuto|grazie|operatore|bloccato)\b/i.test(sample);
  if (it) {
    return desk === "sent"
      ? "Un agente live del desk governance ha il ticket. Risponde in questa chat."
      : "Ticket in coda per un agente live. Risponde qui appena il desk è attivo.";
  }
  return desk === "sent"
    ? "A live agent on the governance desk has this ticket. They reply in this chat."
    : "Ticket queued for a live agent. They reply here as soon as the desk is up.";
}

async function escalate(thread: ThreadRow, history: MsgRow[], reason: string, priority: "normal" | "high", sample: string) {
  await setStatus(thread, "live", reason);
  const desk = await pushDesk("casino.support_ticket", {
    threadId: thread.id,
    userId: thread.user_id,
    email: thread.user_email,
    name: thread.user_name,
    reason,
    priority,
    messages: history.slice(-12).map((m) => ({ role: m.role, body: m.body, at: m.created_at })),
  });
  const sql = await getSql();
  await sql`
    insert into gov_events (user_id, type, title, body)
    values (${thread.user_id}, 'casino.support_ticket', 'Live support', ${reason})
  `.catch(() => undefined);
  const note = handoffNote(desk, sample);
  await insertMessage(thread.id, thread.user_id, "system", note);
  return desk;
}

type ModelTurn = { text: string; escalate: { reason: string; priority: "normal" | "high" } | null };

async function askModel(history: { role: string; body: string }[]): Promise<ModelTurn> {
  const apiKey = env("XAI_API_KEY");
  if (!apiKey) throw new Error("AI is not available");
  const messages = [
    { role: "system", content: SYSTEM },
    ...history.slice(-10).map((m) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.body,
    })),
  ];
  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "grok-4.5",
      temperature: 0.3,
      max_tokens: 280,
      messages,
      tools: [ESCALATE_TOOL],
    }),
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) throw new Error(`xAI API error ${res.status}`);
  const body = (await res.json()) as {
    choices?: { message?: { content?: string | null; tool_calls?: { function?: { name?: string; arguments?: string } }[] } }[];
  };
  const message = body.choices?.[0]?.message;
  const call = message?.tool_calls?.find((c) => c.function?.name === "escalate_to_live_agent");
  return {
    text: (message?.content ?? "").trim(),
    escalate: call ? parseEscalateArgs(call.function?.arguments) : null,
  };
}

async function inboxFor(userId: string, email: string | null): Promise<SupportView> {
  const thread = await ensureThread(userId, email);
  return viewOf(thread, await loadMessages(thread.id));
}

export const supportInbox = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({}))
  .handler(async ({ context }) => inboxFor(context.userId, context.email));

export const supportSend = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ text: z.string().min(1).max(800), handoff: z.boolean().optional() }))
  .handler(async ({ context, data }): Promise<SupportView> => {
    const text = data.text.replace(/\s+/g, " ").trim();
    if (!text) return { ...(await inboxFor(context.userId, context.email)), ok: false, error: "Empty message" };
    const thread = await ensureThread(context.userId, context.email);
    const sql = await getSql();
    const last = await sql<{ body: string; ms: string }>`
      select body, (extract(epoch from created_at) * 1000)::text as ms
      from support_messages
      where thread_id = ${thread.id} and role = 'user'
      order by id desc
      limit 1
    `;
    const lastMs = Number(last[0]?.ms ?? 0);
    if (lastMs && Date.now() - lastMs < 1200) {
      return { ...viewOf(thread, await loadMessages(thread.id)), ok: false, error: "Wait a moment" };
    }
    if (last[0]?.body && last[0].body.toLowerCase() === text.toLowerCase()) {
      return { ...viewOf(thread, await loadMessages(thread.id)), ok: false, error: "Already sent" };
    }

    await insertMessage(thread.id, thread.user_id, "user", text);
    const force = Boolean(data.handoff) || wantsLiveAgent(text);

    if (thread.status === "closed") await setStatus(thread, "ai");

    if (thread.status === "live" || force) {
      let desk: SupportView["desk"] = "idle";
      if (thread.status !== "live") {
        const prior = await loadMessages(thread.id);
        desk = await escalate(thread, prior, force ? text.slice(0, 240) : "Player requested a live agent", "normal", text);
      } else {
        desk = await pushDesk("casino.support_message", {
          threadId: thread.id,
          userId: thread.user_id,
          email: thread.user_email,
          name: thread.user_name,
          body: text,
          role: "user",
        });
      }
      return viewOf(thread, await loadMessages(thread.id), { desk });
    }

    const history = await loadMessages(thread.id);
    try {
      const turn = await askModel(history.filter((m) => m.role === "user" || m.role === "assistant" || m.role === "agent"));
      if (turn.escalate) {
        if (turn.text) await insertMessage(thread.id, thread.user_id, "assistant", turn.text);
        const desk = await escalate(thread, await loadMessages(thread.id), turn.escalate.reason, turn.escalate.priority, text);
        return viewOf(thread, await loadMessages(thread.id), { desk });
      }
      const reply = turn.text || "I can help with deposits, fairness, and limits — or connect you to a live agent.";
      await insertMessage(thread.id, thread.user_id, "assistant", reply);
      return viewOf(thread, await loadMessages(thread.id));
    } catch (e) {
      const message = e instanceof Error ? e.message : "Support AI failed";
      await insertMessage(
        thread.id,
        thread.user_id,
        "system",
        message === "AI is not available"
          ? "Support AI is offline. Ask for a live agent and the governance desk takes the ticket."
          : "Support AI didn't answer. Try again, or ask for a live agent.",
      );
      return viewOf(thread, await loadMessages(thread.id), { ok: false, error: message });
    }
  });

/** Inbound from the governance tower: a real agent replies or closes the ticket. */
export async function applySupportInbound(type: string, payload: Record<string, unknown>) {
  const sql = await getSql();
  const threadId = String(payload.threadId ?? payload.thread_id ?? "");
  const userId = String(payload.userId ?? payload.user_id ?? "");
  let thread: ThreadRow | undefined;
  if (threadId) {
    const rows = await sql<ThreadRow>`
      select id, user_id, user_name, user_email, status, agent_name
      from support_threads where id = ${threadId} limit 1
    `;
    thread = rows[0];
  }
  if (!thread && userId) {
    const rows = await sql<ThreadRow>`
      select id, user_id, user_name, user_email, status, agent_name
      from support_threads where user_id = ${userId}
      order by updated_at desc limit 1
    `;
    thread = rows[0];
  }
  if (!thread && userId) {
    thread = await ensureThread(userId, String(payload.email ?? "") || null);
  }
  if (!thread) return { applied: false, action: "support", error: "thread not found" };

  const agentName = String(payload.agentName ?? payload.agent ?? payload.from ?? "Live agent");
  if (type === "governance.support_close") {
    await setStatus(thread, "closed", undefined, agentName);
    const note = String(payload.note ?? payload.body ?? "This ticket is closed. Send a message to start again.");
    await insertMessage(thread.id, thread.user_id, "system", note.slice(0, 800));
    return { applied: true, action: "support_close", threadId: thread.id, userId: thread.user_id };
  }

  const body = String(payload.body ?? payload.message ?? payload.text ?? "").trim().slice(0, 2000);
  if (!body) return { applied: false, action: "support_reply", error: "empty reply" };
  await setStatus(thread, "live", undefined, agentName);
  await insertMessage(thread.id, thread.user_id, "agent", body);
  await sql`
    insert into gov_events (user_id, type, title, body)
    values (${thread.user_id}, 'governance.support_reply', ${agentName}, ${body.slice(0, 240)})
  `.catch(() => undefined);
  return { applied: true, action: "support_reply", threadId: thread.id, userId: thread.user_id };
}
