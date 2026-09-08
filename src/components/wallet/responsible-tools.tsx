import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  loadResponsible,
  saveResponsible,
  type ResponsibleSettings,
} from "@/lib/responsible";

const EXCLUDE = [
  { label: "Off", ms: 0 },
  { label: "24 hours", ms: 24 * 60 * 60 * 1000 },
  { label: "7 days", ms: 7 * 24 * 60 * 60 * 1000 },
  { label: "30 days", ms: 30 * 24 * 60 * 60 * 1000 },
  { label: "6 months", ms: 182 * 24 * 60 * 60 * 1000 },
];

export function ResponsibleTools() {
  const [settings, setSettings] = useState<ResponsibleSettings>(loadResponsible);

  useEffect(() => {
    setSettings(loadResponsible());
  }, []);

  function persist(next: ResponsibleSettings) {
    setSettings(next);
    saveResponsible(next);
    toast.success("Limits saved");
  }

  return (
    <section className="rounded-2xl bg-card p-5 shadow-[var(--shadow-border)]">
      <h2 className="font-heading text-xl font-semibold">Responsible play</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Limits apply on this device.{" "}
        <Link to="/responsible" className="text-foreground hover:underline">
          Read the policy
        </Link>
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm">
          <Label>Self-exclusion</Label>
          <select
            className="h-11 rounded-lg border border-border bg-muted px-3"
            defaultValue="0"
            onChange={(e) => {
              const ms = Number(e.target.value);
              persist({
                ...settings,
                excludedUntil: ms ? Date.now() + ms : null,
              });
            }}
          >
            {EXCLUDE.map((x) => (
              <option key={x.label} value={x.ms}>
                {x.label}
              </option>
            ))}
          </select>
        </label>
        <LimitField
          label="Deposit limit (USDT / day)"
          value={settings.depositLimit}
          onChange={(n) => persist({ ...settings, depositLimit: n })}
        />
        <LimitField
          label="Wager limit (USDT / day)"
          value={settings.wagerLimit}
          onChange={(n) => persist({ ...settings, wagerLimit: n })}
        />
        <LimitField
          label="Loss limit (USDT / day)"
          value={settings.lossLimit}
          onChange={(n) => persist({ ...settings, lossLimit: n })}
        />
        <LimitField
          label="Session limit (minutes)"
          value={settings.sessionMinutes}
          onChange={(n) => persist({ ...settings, sessionMinutes: n })}
        />
      </div>
      {settings.excludedUntil && settings.excludedUntil > Date.now() ? (
        <p className="mt-3 text-sm text-lime">
          Excluded until {new Date(settings.excludedUntil).toLocaleString()}
        </p>
      ) : null}
    </section>
  );
}

function LimitField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (n: number | null) => void;
}) {
  return (
    <label className="grid gap-1.5 text-sm">
      <Label>{label}</Label>
      <Input
        type="number"
        min={0}
        className="h-11"
        placeholder="No cap"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
      />
    </label>
  );
}
