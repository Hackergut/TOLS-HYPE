import { useMemo, useState } from "react";
import { Button, Card, Chip, Divider, Label, Meter, Modal, SectionHead, Stat } from "../design/ui";
import { HORSES } from "./types";
import { sha256 } from "./fair";
import {
  HOUSE_EDGE,
  TARGET_RTP,
  fieldRTP,
  paytable,
  resolveRound,
  simulateRTP,
  streakMultiplier,
  weightedRTP,
} from "./rtp";

export interface FairState {
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  /** Revealed seed of the previous round (verifiable now). */
  prevServerSeed: string | null;
  prevNonce: number;
  prevClientSeed: string;
}

const pct = (n: number, d = 2) => `${(n * 100).toFixed(d)}%`;

export default function FairnessPanel({
  open,
  onClose,
  fair,
  onClientSeed,
  onRotate,
  stakePerHorse,
  streak,
}: {
  open: boolean;
  onClose: () => void;
  fair: FairState;
  onClientSeed: (s: string) => void;
  onRotate: () => void;
  stakePerHorse: number[];
  streak: number;
}) {
  const [tab, setTab] = useState<"rtp" | "fair" | "verify">("rtp");
  const rows = useMemo(() => paytable(), []);
  const lobbyRTP = weightedRTP(stakePerHorse);
  const mult = streakMultiplier(streak);

  return (
    <Modal open={open} onClose={onClose} title="Fairness & RTP" wide>
      {/* tabs */}
      <div className="mb-3 flex gap-1 rounded-xl bg-black/40 p-1">
        {([
          ["rtp", "Paytable"],
          ["fair", "Provably fair"],
          ["verify", "Verify"],
        ] as const).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`btn-press flex-1 rounded-lg py-1.5 font-heading text-[11px] font-semibold uppercase tracking-[0.16em] transition ${
              tab === k ? "bg-[#904bf9]/20 text-[#c9a6ff]" : "text-[#6b6c76] hover:text-[#a3a4ac]"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {tab === "rtp" && (
        <RtpTab rows={rows} lobbyRTP={lobbyRTP} mult={mult} streak={streak} />
      )}
      {tab === "fair" && <FairTab fair={fair} onClientSeed={onClientSeed} onRotate={onRotate} />}
      {tab === "verify" && <VerifyTab fair={fair} />}
    </Modal>
  );
}

/* ------------------------------------------------------------- Paytable */
function RtpTab({
  rows,
  lobbyRTP,
  mult,
  streak,
}: {
  rows: ReturnType<typeof paytable>;
  lobbyRTP: number;
  mult: number;
  streak: number;
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Base RTP" value={pct(TARGET_RTP, 1)} tone="lime" sub="target" />
        <Stat label="House edge" value={pct(HOUSE_EDGE, 1)} tone="purple" sub="1 − RTP" />
        <Stat label="Field avg" value={pct(fieldRTP(), 2)} tone="neutral" sub="after rounding" />
      </div>

      <Card className="p-3">
        <SectionHead
          title="How payouts are derived"
          right={<Chip tone="purple">math</Chip>}
        />
        <p className="text-[11px] leading-relaxed text-[#a3a4ac]">
          Every runner has a <b className="text-[#fafafa]">declared win probability</b> (they sum to
          exactly 100%). The payout is not hand-tuned — it is derived from it:
        </p>
        <div className="my-2 rounded-lg bg-black/45 px-3 py-2 font-mono text-[11px] text-[#00ffbd]">
          odds = RTP ÷ P(win) &nbsp;&nbsp;→&nbsp;&nbsp; RTP = P(win) × odds
        </div>
        <p className="text-[11px] leading-relaxed text-[#a3a4ac]">
          The winner is drawn from those exact probabilities with the provably-fair seed, then the
          race is animated to match. What you see always equals the published maths.
        </p>
      </Card>

      <Card className="overflow-hidden">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-white/[.08] text-left">
              {["Runner", "P(win)", "Payout", "Implied", "RTP", "Edge"].map((h) => (
                <th
                  key={h}
                  className="px-2 py-2 font-heading text-[9px] font-semibold uppercase tracking-[0.14em] text-[#6b6c76]"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="font-mono tabular-nums">
            {rows.map((r) => (
              <tr key={r.horseId} className="border-b border-white/[.04] last:border-0">
                <td className="px-2 py-1.5">
                  <span className="flex items-center gap-1.5">
                    <span
                      className="h-2.5 w-2.5 rounded-sm"
                      style={{ background: HORSES[r.horseId].color }}
                    />
                    <span className="font-sans font-semibold text-[#fafafa]">
                      {HORSES[r.horseId].name}
                    </span>
                  </span>
                </td>
                <td className="px-2 py-1.5 text-[#fafafa]">{pct(r.trueP, 1)}</td>
                <td className="px-2 py-1.5 font-bold text-[#00ffbd]">{r.odds.toFixed(2)}×</td>
                <td className="px-2 py-1.5 text-[#6b6c76]">{pct(r.impliedP, 2)}</td>
                <td className="px-2 py-1.5 text-[#c9a6ff]">{pct(r.rtp, 2)}</td>
                <td className="px-2 py-1.5 text-[#6b6c76]">{pct(r.edge, 2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card className="p-3">
        <SectionHead title="Your current table" />
        <div className="space-y-2">
          <div>
            <div className="mb-1 flex items-center justify-between">
              <Label>Lobby-weighted RTP</Label>
              <span className="font-mono text-[11px] font-bold text-[#00ffbd]">
                {pct(lobbyRTP, 2)}
              </span>
            </div>
            <Meter value={lobbyRTP} tone="lime" />
          </div>
          <Divider />
          <div className="flex items-center justify-between">
            <div>
              <Label>Streak promo</Label>
              <div className="text-[11px] text-[#a3a4ac]">
                {streak > 0 ? `🔥 ${streak} in a row` : "No active streak"}
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-base font-bold text-[#facc15]">×{mult.toFixed(2)}</div>
              <div className="text-[9px] text-[#6b6c76]">
                effective {pct(TARGET_RTP * mult, 1)}
              </div>
            </div>
          </div>
          <p className="text-[10px] leading-relaxed text-[#6b6c76]">
            The streak bonus is a disclosed promotion applied on top of the base payout. It can push
            the effective return above 100% while the streak is live.
          </p>
        </div>
      </Card>
    </div>
  );
}

/* --------------------------------------------------------- Provably fair */
function FairTab({
  fair,
  onClientSeed,
  onRotate,
}: {
  fair: FairState;
  onClientSeed: (s: string) => void;
  onRotate: () => void;
}) {
  const [draft, setDraft] = useState(fair.clientSeed);
  return (
    <div className="space-y-3">
      <Card className="p-3">
        <SectionHead title="Current round" right={<Chip tone="lime">active</Chip>} />
        <Field label="Server seed (hashed)" value={fair.serverSeedHash} mono />
        <Field label="Nonce" value={String(fair.nonce)} mono />
        <div className="mt-2">
          <Label>Client seed</Label>
          <div className="mt-1 flex gap-1.5">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, 40))}
              className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/45 px-2.5 py-2 font-mono text-[11px] text-[#fafafa] outline-none focus:border-[#904bf9]/60"
              placeholder="your-seed"
            />
            <Button
              variant="purple"
              size="sm"
              onClick={() => onClientSeed(draft.trim() || "derby")}
              disabled={draft.trim() === fair.clientSeed}
            >
              Save
            </Button>
          </div>
          <p className="mt-1 text-[10px] text-[#6b6c76]">
            Changing your client seed changes every future outcome. The server seed is already
            committed — it cannot be altered to react to your bet.
          </p>
        </div>
      </Card>

      <Card className="p-3">
        <SectionHead
          title="Previous round (revealed)"
          right={
            fair.prevServerSeed ? <Chip tone="purple">verifiable</Chip> : <Chip>pending</Chip>
          }
        />
        {fair.prevServerSeed ? (
          <>
            <Field label="Server seed" value={fair.prevServerSeed} mono />
            <Field label="Client seed" value={fair.prevClientSeed} mono />
            <Field label="Nonce" value={String(fair.prevNonce)} mono />
            <Field
              label="SHA-256(server seed)"
              value={sha256(fair.prevServerSeed)}
              mono
              ok
            />
          </>
        ) : (
          <p className="text-[11px] text-[#6b6c76]">
            Finish a race and the seed used will be revealed here.
          </p>
        )}
      </Card>

      <Button variant="outline" size="sm" onClick={onRotate} className="w-full">
        ↻ Rotate server seed now
      </Button>
    </div>
  );
}

function Field({
  label,
  value,
  mono,
  ok,
}: {
  label: string;
  value: string;
  mono?: boolean;
  ok?: boolean;
}) {
  return (
    <div className="mt-2 first:mt-0">
      <Label>{label}</Label>
      <div
        className={`mt-0.5 break-all rounded-lg bg-black/45 px-2.5 py-1.5 text-[10px] ${
          mono ? "font-mono" : ""
        } ${ok ? "text-[#00ffbd]" : "text-[#a3a4ac]"}`}
      >
        {value}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- Verifier */
function VerifyTab({ fair }: { fair: FairState }) {
  const [rounds, setRounds] = useState(20000);
  const [res, setRes] = useState<ReturnType<typeof simulateRTP> | null>(null);
  const [busy, setBusy] = useState(false);
  const rows = paytable();

  const run = () => {
    setBusy(true);
    setTimeout(() => {
      setRes(simulateRTP(fair.serverSeed, fair.clientSeed, rounds));
      setBusy(false);
    }, 16);
  };

  const replay = fair.prevServerSeed
    ? resolveRound(fair.prevServerSeed, fair.prevClientSeed, fair.prevNonce)
    : null;

  return (
    <div className="space-y-3">
      <Card className="p-3">
        <SectionHead title="Replay last round" />
        {replay ? (
          <>
            <p className="mb-2 text-[11px] text-[#a3a4ac]">
              Recomputed locally from the revealed seed — this is exactly what the race showed.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {replay.order.map((id, i) => (
                <span
                  key={id}
                  className="flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[10px] font-bold"
                  style={{
                    borderColor: `${HORSES[id].color}55`,
                    background: `${HORSES[id].color}14`,
                    color: HORSES[id].color,
                  }}
                >
                  <span className="font-mono text-[#6b6c76]">{i + 1}.</span>
                  {HORSES[id].name}
                </span>
              ))}
            </div>
          </>
        ) : (
          <p className="text-[11px] text-[#6b6c76]">No completed round yet.</p>
        )}
      </Card>

      <Card className="p-3">
        <SectionHead
          title="Monte-Carlo RTP test"
          right={<Chip tone="purple">{rounds.toLocaleString()} rounds</Chip>}
        />
        <p className="mb-2 text-[11px] leading-relaxed text-[#a3a4ac]">
          Runs the real resolver thousands of times on your seed pair and compares observed win
          frequency against the declared probability.
        </p>
        <div className="mb-2 flex gap-1.5">
          {[5000, 20000, 100000].map((n) => (
            <Button
              key={n}
              variant={rounds === n ? "purple" : "outline"}
              size="sm"
              onClick={() => setRounds(n)}
              className="flex-1"
            >
              {n / 1000}k
            </Button>
          ))}
        </div>
        <Button variant="lime" size="md" onClick={run} disabled={busy} className="w-full">
          {busy ? "Running…" : "▶ Run test"}
        </Button>

        {res && (
          <div className="mt-3">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-white/[.08] text-left">
                  {["Runner", "Declared", "Observed", "Δ"].map((h) => (
                    <th
                      key={h}
                      className="py-1.5 font-heading text-[9px] font-semibold uppercase tracking-[0.14em] text-[#6b6c76]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="font-mono tabular-nums">
                {res.freq.map((f, i) => {
                  const d = f - rows[i].trueP;
                  return (
                    <tr key={i} className="border-b border-white/[.04] last:border-0">
                      <td className="py-1.5">
                        <span className="flex items-center gap-1.5">
                          <span
                            className="h-2 w-2 rounded-sm"
                            style={{ background: HORSES[i].color }}
                          />
                          <span className="font-sans text-[#fafafa]">{HORSES[i].name}</span>
                        </span>
                      </td>
                      <td className="py-1.5 text-[#6b6c76]">{pct(rows[i].trueP, 2)}</td>
                      <td className="py-1.5 text-[#fafafa]">{pct(f, 2)}</td>
                      <td
                        className={`py-1.5 ${
                          Math.abs(d) < 0.005 ? "text-[#00ffbd]" : "text-[#facc15]"
                        }`}
                      >
                        {d >= 0 ? "+" : ""}
                        {(d * 100).toFixed(2)}pp
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="mt-2 flex items-center justify-between rounded-lg bg-black/45 px-3 py-2">
              <Label>Observed flat-bet RTP</Label>
              <span className="font-mono text-sm font-bold text-[#00ffbd]">{pct(res.rtp, 3)}</span>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
