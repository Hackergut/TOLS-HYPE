import { useEffect, useRef, useState } from "react";
import { SPOTS, type SpotId } from "@/lib/crazy/constants";
import type { CrazyTolsGame } from "@/lib/crazy/useCrazyTols";
import Icon from "./Icon";
import { SolanaCoin } from "./Brand";

export const DISPLAY_SPOTS: SpotId[] = ["one", "two", "five", "ten", "coinflip", "cashhunt", "pachinko", "crazytime"];
export function spotLabel(spot: SpotId) {
  return ({ one: "1", two: "2", five: "5", ten: "10", coinflip: "Coin Flip", cashhunt: "Cash Hunt", pachinko: "Pachinko", crazytime: "CrazyTols" })[spot];
}

export default function BetPanel({ game, autoSpin, onRules, onAutoPlay }: { game: CrazyTolsGame; autoSpin: boolean; onRules: () => void; onAutoPlay: () => void }) {
  const [presets, setPresets] = useState(false);
  const presetRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const outside = (event: PointerEvent) => { if (!presetRef.current?.contains(event.target as Node)) setPresets(false); };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, []);
  const definition = SPOTS[game.selected];
  const busy = !["bet", "result"].includes(game.phase);
  const spin = () => game.phase === "result" ? game.nextRound() : game.launchSpin();
  return (
    <section className="bet-panel" aria-label="Betting controls">
      <div className="spin-actions">
        <button className={`primary-button spin-button ${busy ? "is-spinning" : ""}`} onClick={spin} disabled={busy || game.paused || game.screen === "over" || game.autoPlay.active}>
          {game.autoPlay.active ? `Auto ${game.autoPlay.total - game.autoPlay.remaining}/${game.autoPlay.total}` : busy ? <><span className="button-spinner" />{game.phase === "bonus" ? "Bonus round" : "Spinning"}</> : game.phase === "result" ? "Next round" : "Spin"}
          {!busy && !game.autoPlay.active && <span className="spin-shortcut">SPACE</span>}
        </button>
        <button className={`auto-play-button ${game.autoPlay.active ? "active" : ""}`} onClick={game.autoPlay.active ? () => game.stopAutoPlay("Auto Play stopped.") : onAutoPlay} disabled={game.screen === "over" || (!game.autoPlay.active && game.phase !== "bet")} aria-label={game.autoPlay.active ? "Stop Auto Play" : "Configure Auto Play"} title={game.autoPlay.active ? "Stop Auto Play" : "Auto Play"}>
          {game.autoPlay.active ? <span className="auto-stop" /> : <Icon name="repeat" size={17} />}<small>{game.autoPlay.active ? "STOP" : "AUTO"}</small>
        </button>
      </div>

      <div className="bet-amount-block">
        <div className="field-label"><label htmlFor="bet-amount">Bet Amount</label><span>{game.denom.fmt(game.chip)} {game.denom.code}</span></div>
        <div className="amount-input">
          <div className="preset-control" ref={presetRef} onKeyDown={(event) => { if (event.key === "Escape" && presets) { event.stopPropagation(); setPresets(false); } }}>
            <button className="currency-select" onClick={() => setPresets((value) => !value)} disabled={!game.canBet} aria-label="Select chip amount" aria-expanded={presets}>
              <SolanaCoin /><Icon name="down" size={12} />
            </button>
            {presets && <div className="preset-menu">
              <span>Quick chips</span>
              {game.denom.chips.map((chip) => <button key={chip.value} onClick={() => { game.setChip(chip.value); setPresets(false); }} disabled={chip.value > game.balance}><span>{chip.label}</span><kbd>{game.denom.chips.indexOf(chip) + 1}</kbd></button>)}
            </div>}
          </div>
          <input id="bet-amount" type="number" inputMode="numeric" min={game.denom.minBet} max={game.balance} step="any" value={game.chip || ""} onChange={(event) => game.setChip(Number(event.target.value))} onBlur={() => { if (!Number.isFinite(game.chip) || game.chip < game.denom.minBet) game.setChip(game.denom.minBet); }} disabled={!game.canBet} />
          <button className="amount-adjust" onClick={() => game.setChip(Math.max(game.denom.minBet, Math.round(game.chip / 2 * 100) / 100))} disabled={!game.canBet} title="Halve bet" aria-label="Halve bet">&frac12;</button>
          <button className="amount-adjust" onClick={() => game.setChip(Math.max(game.denom.minBet, Math.min(game.balance, game.chip * 2)))} disabled={!game.canBet} title="Double bet" aria-label="Double bet">2&times;</button>
        </div>
      </div>

      <div className="bet-spot-block">
        <div className="field-label"><span>Bet spot</span><button className="text-icon-button" aria-label="How betting works" onClick={onRules}><Icon name="info" size={14} /></button></div>
        <div className="bet-spot-grid">
          {DISPLAY_SPOTS.map((spot) => {
            const active = game.selected === spot;
            const amount = game.bets[spot];
            return <button key={spot} id={`spot-${spot}`} className={`bet-spot ${active ? "selected" : ""} ${amount && !active ? "has-bet" : ""} ${game.winner === spot ? "winning-spot" : ""}`} disabled={!game.canBet} onClick={() => game.place(spot)} aria-label={`Bet ${game.denom.fmt(game.chip)} ${game.denom.code} on ${spotLabel(spot)}${amount ? `, current bet ${amount}` : ""}`} aria-pressed={active}>
              <span>{spotLabel(spot)}</span>
              {amount > 0 && <span key={amount} className="stake-counter">{game.denom.fmt(amount)}</span>}
              {game.topRevealed && game.topSlot?.spot === spot && <span className="top-indicator">TOP</span>}
            </button>;
          })}
        </div>
        <p className="bet-description">{definition.pays !== null ? `Number pays ${definition.pays}:1` : "Bonus round"}<span>&middot;</span>stake {game.denom.fmt(game.bets[game.selected])} {game.denom.code}</p>
      </div>

      <div className="bet-management">
        <div className="bet-total"><span>Total bet</span><strong>{game.denom.fmt(game.totalBet)} <small>{game.denom.code}</small></strong></div>
        <div className="bet-secondary-actions">
          <button onClick={game.clearBets} disabled={!game.canBet || game.totalBet === 0} title="Clear bets (C)"><Icon name="undo" size={14} />Clear</button>
          <button onClick={game.repeatBets} disabled={!game.canBet} title="Repeat previous bets (X)"><Icon name="repeat" size={14} />Repeat</button>
        </div>
      </div>

      <div className="bet-panel-footer">
        {game.screen === "start" ? <div className="start-instruction"><div><span className="status-dot" />Ready when you are</div><p>Pick your spots. Make it a crazy spin.</p></div> : <div className="round-progress">
          <div><span>{game.phase === "bet" ? autoSpin && game.totalBet ? "Bets close in" : "Place your bets" : game.phase === "result" ? "Round complete" : "Bets are locked"}</span><strong>{game.phase === "bet" && autoSpin && game.totalBet > 0 ? `${Math.ceil(game.timeLeft)}s` : `Round ${game.round}`}</strong></div>
          <div className="countdown-track"><i style={{ transform: `scaleX(${game.phase === "bet" ? game.timeLeft / 10 : 0})` }} /></div>
        </div>}
        <div className="demo-caption"><Icon name="shield" size={13} /><span>Play money. No real funds.</span></div>
      </div>
    </section>
  );
}