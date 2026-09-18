import { useState } from "react";
import type { RoundRecord } from "@/lib/crazy/useCrazyTols";
import type { ScoreEntry } from "@/lib/crazy/storage";
import { fmt } from "@/lib/crazy/constants";
import Icon from "./Icon";
import { spotLabel } from "./BetPanel";

const TABS = ["My Bets", "High Roller", "Weekly Race", "Lottery"];

export function ScoreTable({ scores, highlight }: { scores: ScoreEntry[]; highlight?: number }) {
  return scores.length ? <div className="score-table"><div className="score-heading"><span>Player</span><span>Rounds</span><span>Score</span></div>{scores.map((entry, index) => <div key={`${entry.date}-${index}`} className={`score-row ${highlight === entry.date ? "highlight" : ""}`}><span><b className={index === 0 ? "gold-text" : ""}>{String(index + 1).padStart(2, "0")}</b>{entry.name}</span><span>{entry.rounds}</span><strong>{fmt(entry.score)}</strong></div>)}</div> : <div className="empty-state compact"><Icon name="trophy" size={28} /><strong>A place for your best run.</strong><p>End a session to save your score on this device.</p></div>;
}

export default function ActivityTable({ records, scores, onRules }: { records: RoundRecord[]; scores: ScoreEntry[]; onRules: () => void }) {
  const [tab, setTab] = useState("My Bets");
  const week = new Date();
  week.setHours(0, 0, 0, 0);
  week.setDate(week.getDate() - ((week.getDay() + 6) % 7));
  return (
    <section className="activity-section" id="activity" aria-label="Game activity">
      <div className="activity-tabs" role="tablist" aria-label="Activity views">
        {TABS.map((name, index) => <button key={name} role="tab" id={`tab-${name.replace(/ /g, "-")}`} aria-selected={tab === name} aria-controls="activity-content" tabIndex={tab === name ? 0 : -1} className={tab === name ? "active" : ""} onClick={() => setTab(name)} onKeyDown={(event) => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
          event.preventDefault();
          const next = event.key === "Home" ? 0 : event.key === "End" ? TABS.length - 1 : (index + (event.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length;
          setTab(TABS[next]);
          document.getElementById(`tab-${TABS[next].replace(/ /g, "-")}`)?.focus();
        }}>{name}</button>)}
      </div>
      <div className="activity-content" id="activity-content" role="tabpanel" aria-labelledby={`tab-${tab.replace(/ /g, "-")}`}>
        {tab === "My Bets" ? <>
          <div className="activity-table-scroll"><table className="rounds-table"><thead><tr><th>Game</th><th>Round</th><th>Bet amount</th><th>Result</th><th>Multiplier</th><th>Payout</th></tr></thead><tbody>{records.map((record) => <tr key={record.id}><td><span className="game-cell"><Icon name="wheel" size={15} />CrazyTols</span></td><td>#{String(record.round).padStart(4, "0")}</td><td>{fmt(record.bet)} <small>CR</small></td><td>{spotLabel(record.spot)}</td><td>{record.multiplier ? `${record.multiplier}x` : "-"}</td><td className={record.payout > 0 ? "positive-text" : "muted-text"}>{record.payout > 0 ? "+" : ""}{fmt(record.payout)} <small>CR</small></td></tr>)}</tbody></table></div>
          {!records.length && <div className="empty-state"><Icon name="wheel" size={28} /><strong>Your next spin starts here.</strong><p>Place a bet to see your round history.</p></div>}
          <div className="table-note"><span className="status-dot" />Your session only. No simulated live bets.</div>
        </> : tab === "Lottery" ? <div className="empty-state"><Icon name="ticket" size={28} /><strong>No active lottery</strong><p>Platform draws are not enabled in this demo.<br />Your four wheel bonus rounds are ready to play.</p><button className="text-link" onClick={onRules}>Explore bonus rounds <Icon name="arrow" size={15} /></button></div> : <div className="leaderboard-view"><div className="leaderboard-label"><span>{tab === "Weekly Race" ? "This week's best runs" : "Your highest scores"}</span><small>Saved on this device</small></div><ScoreTable scores={tab === "Weekly Race" ? scores.filter((entry) => entry.date >= week.getTime()) : scores} /></div>}
      </div>
    </section>
  );
}