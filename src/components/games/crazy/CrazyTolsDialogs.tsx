import { useState } from "react";
import Dialog from "./Dialog";
import Icon from "./Icon";
import { ScoreTable } from "./ActivityTable";
import type { CrazyTolsGame } from "@/lib/crazy/useCrazyTols";
import { MATH_AUDIT, simulateWheel } from "@/lib/crazy/math";
import { spotLabel } from "./BetPanel";

export type CrazyPanel = "autoplay" | "settings" | "vip" | "fairness" | "responsible" | "rules" | "help" | null;

function Toggle({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: () => void }) {
  return (
    <div className="setting-row">
      <div>
        <strong>{label}</strong>
        <p>{description}</p>
      </div>
      <button role="switch" className={`toggle ${checked ? "on" : ""}`} aria-checked={checked} aria-label={label} onClick={onChange}>
        <i />
      </button>
    </div>
  );
}

export default function CrazyTolsDialogs({
  panel,
  game,
  close,
  autoSpin,
  setAutoSpin,
  effects,
  setEffects,
  onCashier,
}: {
  panel: Exclude<CrazyPanel, null>;
  game: CrazyTolsGame;
  close: () => void;
  autoSpin: boolean;
  setAutoSpin: (value: boolean) => void;
  effects: boolean;
  setEffects: (value: boolean) => void;
  onCashier: () => void;
}) {
  const [autoRounds, setAutoRounds] = useState(10);
  const [stopLoss, setStopLoss] = useState(0);
  const [takeProfit, setTakeProfit] = useState(0);
  const [simulation, setSimulation] = useState<ReturnType<typeof simulateWheel> | null>(null);
  const fmt = game.denom.fmt;
  const code = game.denom.code;

  if (panel === "autoplay")
    return (
      <Dialog title="Auto Play" subtitle="Set your limits before the wheel starts." onClose={close}>
        <div className="autoplay-summary">
          <span>Bet per spin</span>
          <strong>
            {fmt(game.totalBet)} {code}
          </strong>
          <small>Your current bets repeat unchanged.</small>
        </div>
        {!game.totalBet && <p className="notice-box">Place at least one bet before starting Auto Play.</p>}
        <div className="autoplay-rounds">
          <span>Number of spins</span>
          <div>
            {[10, 25, 50, 100].map((value) => (
              <button key={value} className={autoRounds === value ? "active" : ""} onClick={() => setAutoRounds(value)}>
                {value}
              </button>
            ))}
          </div>
        </div>
        <div className="limit-grid">
          <label className="dialog-field">
            Stop-loss ({code})
            <input type="number" inputMode="numeric" min="0" step="any" value={stopLoss} onChange={(event) => setStopLoss(Math.max(0, Number(event.target.value)))} />
          </label>
          <label className="dialog-field">
            Take-profit ({code})
            <input type="number" inputMode="numeric" min="0" step="any" value={takeProfit} onChange={(event) => setTakeProfit(Math.max(0, Number(event.target.value)))} />
          </label>
        </div>
        <div className="auto-safety">
          <Icon name="shield" size={18} />
          <p>Auto Play stops after the selected spins, when a limit is reached, when funds are insufficient, or when you press STOP. Bonus rounds still require your input.</p>
        </div>
        <button
          className="primary-button"
          disabled={!game.totalBet || game.screen === "over"}
          onClick={() => {
            if (game.startAutoPlay(autoRounds, stopLoss, takeProfit)) close();
          }}
        >
          <Icon name="play" size={16} />
          Start {autoRounds} spins
        </button>
        <p className="dialog-footnote">Limits compare your available balance with the bankroll at Auto Play start. Closing the page stops the sequence.</p>
      </Dialog>
    );

  if (panel === "settings")
    return (
      <Dialog title="Game settings" subtitle="Make this table yours." onClose={close}>
        <label className="dialog-field">
          Player name
          <input value={game.name} maxLength={18} disabled={game.screen === "play"} onChange={(event) => game.setName(event.target.value)} placeholder="Your name" />
        </label>
        {game.screen === "play" && <p className="dialog-footnote">Your player name can be changed between sessions.</p>}
        <Toggle label="Game sounds" description="Wheel ticks, chips and win sounds." checked={!game.muted} onChange={() => game.setMuted(!game.muted)} />
        <Toggle label="Win effects" description="Particles, confetti and screen shake." checked={effects} onChange={() => setEffects(!effects)} />
        <Toggle label="Betting countdown" description="Spin automatically 10 seconds after a bet." checked={autoSpin} onChange={() => setAutoSpin(!autoSpin)} />
        <div className="dialog-actions">
          <button
            className="secondary-button"
            disabled={game.screen !== "play"}
            onClick={() => {
              game.setUserPaused(true);
              close();
            }}
          >
            <Icon name="pause" size={16} />
            Pause game
          </button>
          <button className="secondary-button" onClick={onCashier}>
            <Icon name="plus" size={16} />
            Add funds
          </button>
          <button
            className="secondary-button"
            disabled={!game.canCashOut}
            onClick={() => {
              game.cashOut();
              close();
            }}
          >
            <Icon name="logout" size={16} />
            End session
          </button>
        </div>
        <button
          className="text-link centered"
          onClick={() => {
            game.restart();
            close();
          }}
        >
          <Icon name="repeat" size={14} />
          Reset table
        </button>
      </Dialog>
    );

  if (panel === "vip")
    return (
      <Dialog title="High rollers" subtitle="Your best sessions, saved on this device." onClose={close}>
        <ScoreTable scores={game.scores} />
      </Dialog>
    );

  if (panel === "fairness")
    return (
      <Dialog title="Math & fairness audit" subtitle="Transparent demo mathematics. Not a gambling certification." onClose={close} wide>
        <div className="info-intro">
          <Icon name="shield" size={30} />
          <div>
            <strong>Server-settled table</strong>
            <p>54 segments. Every round is generated and settled by the platform server.</p>
          </div>
        </div>
        <p className="body-copy">The wheel distribution is checked at startup against the versioned math manifest. The values below are exact theoretical returns for number bets under the current Top Slot rules.</p>
        <div className={`math-status ${MATH_AUDIT.passed ? "passed" : "failed"}`}>
          <Icon name={MATH_AUDIT.passed ? "check" : "info"} size={16} />
          <strong>{MATH_AUDIT.passed ? "Math manifest passed" : "Math manifest failed"}</strong>
          <span>{MATH_AUDIT.version}</span>
        </div>
        <div className="rtp-table">
          <div>
            <span>Spot</span>
            <span>Chance</span>
            <span>Base RTP</span>
            <span>With Top Slot</span>
          </div>
          {MATH_AUDIT.numberRtp.map((row) => (
            <div key={row.spot}>
              <strong>{spotLabel(row.spot)}</strong>
              <span>{(row.probability * 100).toFixed(4)}%</span>
              <span>{(row.baseRtp * 100).toFixed(4)}%</span>
              <span>{(row.topSlotRtp * 100).toFixed(4)}%</span>
            </div>
          ))}
        </div>
        <dl className="detail-list">
          <div>
            <dt>Segments</dt>
            <dd>1: 21 / 2: 13 / 5: 7 / 10: 4 / Bonus: 9</dd>
          </div>
          <div>
            <dt>Top Slot mean</dt>
            <dd>{MATH_AUDIT.topSlotMean.toFixed(6)}x across 10 weighted entries</dd>
          </div>
          <div>
            <dt>Top Slot spots</dt>
            <dd>1: 35% / 2: 33% / 5: 20% / 10: 12%</dd>
          </div>
          <div>
            <dt>Settlement</dt>
            <dd>Platform wallet, server-authoritative rounds</dd>
          </div>
        </dl>
        <button className="secondary-button audit-button" onClick={() => setSimulation(simulateWheel())}>
          <Icon name="chart" size={16} />
          Run 250,000-spin sampler test
        </button>
        {simulation && (
          <div className={`simulation-result ${simulation.passed ? "passed" : "failed"}`}>
            <strong>{simulation.passed ? "PASS" : "REVIEW"}</strong>
            <span>{simulation.spins.toLocaleString()} deterministic spins</span>
            <span>max frequency deviation {(simulation.maxDeviation * 100).toFixed(4)}%</span>
          </div>
        )}
        <p className="dialog-footnote">Exact numeric RTP range: 94.814815%-98.194444%. Bonus rounds animate server-generated walls and paths; Cash Hunt settles after your pick. This is a demo profile, not a gambling certification.</p>
      </Dialog>
    );

  if (panel === "responsible")
    return (
      <Dialog title="Play at your own pace" subtitle="Keep it fun. Stay in control." onClose={close}>
        <p className="body-copy">This table plays with your platform demo balance. Outcomes are random and past results do not predict the next spin. Take a break whenever you need one.</p>
        <dl className="detail-list">
          <div>
            <dt>Rounds played</dt>
            <dd>{game.completed}</dd>
          </div>
          <div>
            <dt>Available balance</dt>
            <dd>
              {fmt(game.balance)} {code}
            </dd>
          </div>
        </dl>
        <div className="dialog-actions">
          <button
            className="primary-button"
            onClick={() => {
              game.setUserPaused(true);
              close();
            }}
            disabled={game.screen !== "play"}
          >
            Take a break
          </button>
          <button
            className="secondary-button"
            onClick={() => {
              game.cashOut();
              close();
            }}
            disabled={!game.canCashOut}
          >
            End session
          </button>
        </div>
        <p className="dialog-footnote">Real-money platforms must apply local licensing, age verification and responsible-gaming requirements.</p>
      </Dialog>
    );

  if (panel === "rules" || panel === "help")
    return (
      <Dialog title={panel === "rules" ? "How to play CRAZYTOLS" : "TOLS help center"} subtitle="One wheel. Four ways to go a little crazy." onClose={close} wide>
        <ol className="how-to">
          <li>
            <b>01</b>
            <div>
              <strong>Set your bet</strong>
              <p>
                Enter an amount or select a quick chip. Minimum: {fmt(game.denom.minBet)} {code}.
              </p>
            </div>
          </li>
          <li>
            <b>02</b>
            <div>
              <strong>Pick your spots</strong>
              <p>Tap a number or bonus to add a chip. You can bet on several spots.</p>
            </div>
          </li>
          <li>
            <b>03</b>
            <div>
              <strong>Give it a spin</strong>
              <p>Top Slot boosts one spot. If the wheel lands on your bet, you win.</p>
            </div>
          </li>
        </ol>
        <div className="bonus-guide">
          {[
            ["Coin Flip", "Flip the coin. Red or blue reveals your multiplier."],
            ["Cash Hunt", "Choose a hidden target before the timer runs out."],
            ["Pachinko", "Aim your drop. Bounce through pegs to a multiplier."],
            ["CrazyTols", "Pick a flapper and spin the bonus wheel. Doubles trigger a respin."],
          ].map(([title, description]) => (
            <details key={title}>
              <summary>
                {title}
                <Icon name="plus" size={15} />
              </summary>
              <p>{description}</p>
            </details>
          ))}
        </div>
        <div className="keyboard-guide">
          {[
            ["SPACE", "Spin / next round"],
            ["1 - 4", "Select quick chip"],
            ["Q W E R", "Bet on numbers"],
            ["A S D F", "Bet on bonuses"],
            ["C / X", "Clear / repeat bets"],
            ["P / ESC", "Pause / resume"],
          ].map(([key, value]) => (
            <div key={key}>
              <kbd>{key}</kbd>
              <span>{value}</span>
            </div>
          ))}
        </div>
        <p className="dialog-footnote">On touch screens, every action is available with a tap. Bets settle against your platform balance.</p>
      </Dialog>
    );

  return null;
}
