import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RiFileCopyLine } from "@remixicon/react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { copyText } from "@/lib/bet-history";
import { getFairState, rotateServerSeed } from "@/lib/fair-api";
import { cn } from "cn";

export function FairModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [tab, setTab] = useState<"seeds" | "verify">("seeds");
  const [client, setClient] = useState("");
  const [hash, setHash] = useState("");
  const [nextHash, setNextHash] = useState("");
  const [nonce, setNonce] = useState(0);
  const [draft, setDraft] = useState("");
  const [revealed, setRevealed] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkSeed, setCheckSeed] = useState("");
  const [checkClient, setCheckClient] = useState("");
  const [checkNonce, setCheckNonce] = useState("0");
  const [check, setCheck] = useState("");

  useEffect(() => {
    if (!open) return;
    void getFairState()
      .then((s) => {
        setClient(s.clientSeed);
        setHash(s.serverHash);
        setNextHash(s.nextServerHash);
        setNonce(s.nonce);
        setDraft(s.clientSeed);
      })
      .catch(() => undefined);
  }, [open]);

  function copy(value: string) {
    if (!value) return;
    if (copyText(value)) toast.success("Copied");
    else void navigator.clipboard?.writeText(value).then(() => toast.success("Copied"), () => toast.message(value));
  }

  async function changePair() {
    const next = draft.trim();
    if (next.length < 1) {
      toast.error("Enter a client seed");
      return;
    }
    setBusy(true);
    try {
      const res = await rotateServerSeed({ data: { clientSeed: next } });
      setRevealed(res.revealedSeed);
      setClient(res.clientSeed);
      setHash(res.nextHash);
      setNextHash(res.nextServerHash);
      setNonce(0);
      setDraft(res.clientSeed);
      toast.success("Seed pair rotated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Rotate failed");
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    const seed = checkSeed.trim();
    if (!seed) {
      toast.error("Paste the server seed");
      return;
    }
    const hashed = await sha256(seed);
    const matches = hashed === hash;
    const nonceN = Number(checkNonce) || 0;
    const unit = checkClient.trim() ? await hmacUnit(seed, checkClient.trim(), nonceN) : null;
    setCheck(matches ? `Hash matches.${unit != null ? ` First unit ${unit.toFixed(6)}` : ""}` : "Hash does not match the active server seed.");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] gap-0 overflow-y-auto bg-[#121418] p-10 sm:max-w-[32rem]">
        <DialogTitle className="mb-8 text-center text-[22px] font-bold text-white">Provably Fair</DialogTitle>
        <div className="flex border-b border-[#4d5361]">
          {(["seeds", "verify"] as const).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                "h-8 flex-1 text-sm font-bold",
                tab === id ? "text-lime" : "font-normal text-white/80",
              )}
            >
              {id === "seeds" ? "Seeds" : "Verify"}
            </button>
          ))}
        </div>
        {tab === "seeds" ? (
          <div className="mt-8 grid gap-4">
            <SeedField label="Active client seed" value={client} onCopy={() => copy(client)} />
            <SeedField label="Active server seed (hashed)" value={hash} onCopy={() => copy(hash)} />
            <label className="grid gap-1">
              <span className="text-xs font-medium">Total bets with this pair</span>
              <input readOnly value={nonce} className="h-12 rounded-md border border-[#2a2e38] bg-transparent px-4 text-sm text-[#828998]" />
            </label>
            <h3 className="mt-2 text-[22px] font-bold">Rotate seed pair</h3>
            <div className="grid gap-1">
              <span className="text-xs font-medium">New client seed</span>
              <div className="grid grid-cols-[3fr_1fr] gap-4">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="h-12 rounded-md bg-[#202329] px-4 text-sm"
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void changePair()}
                  className="h-12 rounded-md bg-lime text-sm font-medium text-black disabled:opacity-50"
                >
                  Change
                </button>
              </div>
            </div>
            <SeedField label="Next server seed (hashed)" value={nextHash} onCopy={() => copy(nextHash)} />
            {revealed ? (
              <SeedField label="Previous server seed" value={revealed} onCopy={() => copy(revealed)} />
            ) : null}
          </div>
        ) : (
          <div className="mt-8 grid gap-4">
            <Field label="Server seed" value={checkSeed} onChange={setCheckSeed} />
            <Field label="Client seed" value={checkClient} onChange={setCheckClient} />
            <Field label="Nonce" value={checkNonce} onChange={setCheckNonce} />
            <button type="button" onClick={() => void verify()} className="h-12 rounded-md bg-lime text-sm font-medium text-black">
              Verify
            </button>
            {check ? <p className="text-sm text-lime">{check}</p> : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SeedField({ label, value, onCopy }: { label: string; value: string; onCopy: () => void }) {
  return (
    <label className="grid gap-1">
      <span className="text-xs font-medium">{label}</span>
      <span className="relative">
        <input readOnly value={value} className="h-12 w-full rounded-md border border-[#2a2e38] bg-transparent pr-12 pl-4 text-sm text-[#828998]" />
        <button type="button" aria-label={`Copy ${label}`} onClick={onCopy} className="absolute top-0 right-0 grid h-12 w-12 place-items-center text-white">
          <RiFileCopyLine className="size-4" />
        </button>
      </span>
    </label>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="grid gap-1">
      <span className="text-xs font-medium">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="h-12 rounded-md bg-[#202329] px-4 text-sm" />
    </label>
  );
}

async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return hex(buf);
}

async function hmacUnit(serverSeed: string, clientSeed: string, nonce: number) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(serverSeed), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const buf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${clientSeed}:${nonce}:0`));
  const bytes = new Uint8Array(buf);
  let v = 0n;
  for (let i = 0; i < 8; i += 1) v = (v << 8n) | BigInt(bytes[i] ?? 0);
  return Number(v >> 11n) / 2 ** 53;
}

function hex(buf: ArrayBuffer) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
