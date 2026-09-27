import { getSql } from "@/lib/db";
import { getGame } from "@/lib/games-catalog";

export type PresenceTouch = {
  userId: string;
  email?: string | null;
  name?: string | null;
  gameId?: string | null;
  device?: string | null;
  wager?: number;
  /** lobby clears the open game; game sets it; keep leaves it. */
  place?: "lobby" | "game" | "keep";
};

function cleanId(value: string | null | undefined): string | null {
  const id = (value ?? "").trim();
  if (!id || !/^[a-zA-Z0-9_.:-]{1,80}$/.test(id)) return null;
  return id;
}

/**
 * Writes the real signed-in player into `player_presence`.
 * The governance live map reads only this table. Never invents a user id.
 */
export async function touchPresence(input: PresenceTouch): Promise<void> {
  const userId = input.userId.trim();
  if (!userId || userId === "dev-user") return;
  const sql = await getSql();
  let name = input.name?.trim() || null;
  let email = input.email?.trim() || null;
  if (!name || !email) {
    try {
      const rows = await sql<{ name: string | null; email: string | null }>`
        select "name", "email" from "user" where "id" = ${userId} limit 1
      `;
      name = name || rows[0]?.name || null;
      email = email || rows[0]?.email || null;
    } catch {
      /* identity table is optional for guests */
    }
  }
  if (email?.endsWith("@social.tols.fun")) email = null;
  const gameKey = cleanId(input.gameId);
  const game = gameKey ? getGame(gameKey) : undefined;
  const gameId = game?.id ?? gameKey;
  const gameTitle = game?.title ?? null;
  const device = input.device === "mobile" || input.device === "desktop" ? input.device : null;
  const wager = Number.isFinite(input.wager) && (input.wager ?? 0) > 0 ? Number(input.wager) : 0;
  const display = name || (userId.startsWith("guest_") ? "Ospite" : userId);
  const place = input.place ?? "keep";

  if (place === "lobby") {
    await sql`
      insert into player_presence (
        user_id, display_name, email, status, current_game, current_game_title,
        last_seen, connected_at, device, session_wagered
      ) values (
        ${userId}, ${display}, ${email}, 'online', null, null, now(), now(), ${device}, ${wager}
      )
      on conflict (user_id) do update set
        display_name = excluded.display_name,
        email = coalesce(excluded.email, player_presence.email),
        status = 'online',
        current_game = null,
        current_game_title = null,
        last_seen = now(),
        device = coalesce(excluded.device, player_presence.device),
        session_wagered = player_presence.session_wagered + excluded.session_wagered
    `;
    return;
  }

  if (place === "game" && gameId) {
    await sql`
      insert into player_presence (
        user_id, display_name, email, status, current_game, current_game_title,
        last_seen, connected_at, device, session_wagered
      ) values (
        ${userId}, ${display}, ${email}, 'online', ${gameId}, ${gameTitle}, now(), now(), ${device}, ${wager}
      )
      on conflict (user_id) do update set
        display_name = excluded.display_name,
        email = coalesce(excluded.email, player_presence.email),
        status = 'online',
        current_game = excluded.current_game,
        current_game_title = coalesce(excluded.current_game_title, player_presence.current_game_title),
        last_seen = now(),
        device = coalesce(excluded.device, player_presence.device),
        session_wagered = player_presence.session_wagered + excluded.session_wagered
    `;
    return;
  }

  await sql`
    insert into player_presence (
      user_id, display_name, email, status, last_seen, connected_at, device, session_wagered
    ) values (
      ${userId}, ${display}, ${email}, 'online', now(), now(), ${device}, ${wager}
    )
    on conflict (user_id) do update set
      display_name = excluded.display_name,
      email = coalesce(excluded.email, player_presence.email),
      status = 'online',
      last_seen = now(),
      device = coalesce(excluded.device, player_presence.device),
      session_wagered = player_presence.session_wagered + excluded.session_wagered
  `;
}
