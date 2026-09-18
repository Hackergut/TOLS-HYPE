import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import PlatformDialogs, { type CrazyPanel } from "./CrazyTolsDialogs";
import BetPanel from "./BetPanel";
import ActivityTable, { ScoreTable } from "./ActivityTable";
import WheelCanvas, { WHEEL_COLORS } from "./WheelCanvas";
import TopSlotPill from "./TopSlotPill";
import BonusGame from "./BonusGame";
import FxCanvas from "./FxCanvas";
import Dialog from "./Dialog";
import Icon from "./Icon";
import { TolsWordmark } from "./Brand";
import { type SpotId } from "@/lib/crazy/constants";
import { fx } from "@/lib/crazy/juice";
import { sfx } from "@/lib/crazy/audio";
import { useCrazyTols, type Bets, type Denom, type Speed, type SpinOutcome } from "@/lib/crazy/useCrazyTols";

export function CrazyTolsTable({
  denom,
  walletBalance,
  onSpin,
  onCashHunt,
  externalBlocked = false,
  onCashier,
}: {
  denom: Denom;
  walletBalance: number;
  onSpin: (bets: Bets) => Promise<SpinOutcome>;
  onCashHunt: (token: string, cell: number) => Promise<{ payout: number; multiplier: number; balance: number }>;
  externalBlocked?: boolean;
  onCashier: () => void;
}) {
  const [autoSpin, setAutoSpin] = useState(true);
  const [effects, setEffects] = useState(() => !window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [speed, setSpeed] = useState<Speed>(1);
  const wheelRef = useRef<HTMLDivElement>(null);
  const [panel, setPanel] = useState<CrazyPanel>(null);
  const [favorite, setFavorite] = useState(() => {
    try {
      return localStorage.getItem("crazytols-favorite") === "true";
    } catch {
      return false;
    }
  });
  const [toast, setToast] = useState("");
  const toastTimer = useRef(0);
  const tableRef = useRef<HTMLDivElement>(null);
  const notice = useCallback((message: string) => {
    window.clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = window.setTimeout(() => setToast(""), 3000);
  }, []);
  const game = useCrazyTols({
    blocked: panel !== null || externalBlocked,
    autoSpin,
    speed,
    effects,
    wheelRef,
    notice,
    denom,
    walletBalance,
    onSpin,
    onCashHunt,
  });
  const gameRef = useRef(game);
  gameRef.current = game;
  const busy = !["bet", "result"].includes(game.phase);

  useEffect(() => {
    fx.enabled = effects;
    fx.shakeTarget = effects ? tableRef.current : null;
    if (!effects) {
      fx.clear();
      if (tableRef.current) tableRef.current.style.transform = "";
    }
    return () => {
      fx.shakeTarget = null;
    };
  }, [effects]);
  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      const current = gameRef.current;
      if (panel || event.repeat) return;
      if (current.userPaused && (event.code === "Escape" || event.code === "KeyP")) {
        event.preventDefault();
        current.setUserPaused(false);
        return;
      }
      const target = event.target as HTMLElement;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable) return;
      if (event.code === "KeyM") {
        current.setMuted(!current.muted);
        return;
      }
      if (["KeyP", "Escape"].includes(event.code) && current.screen === "play") {
        event.preventDefault();
        current.setUserPaused(!current.userPaused);
        return;
      }
      if (target.tagName === "BUTTON" && ["Space", "Enter"].includes(event.code)) return;
      if (current.paused || current.phase === "bonus") return;
      const chipIndex = ["Digit1", "Digit2", "Digit3", "Digit4"].indexOf(event.code);
      if (chipIndex >= 0 && current.canBet) {
        current.setChip(current.denom.chips[chipIndex]?.value ?? current.denom.minBet);
        sfx.click();
        return;
      }
      const spotKeys: Record<string, SpotId> = { KeyQ: "one", KeyW: "two", KeyE: "five", KeyR: "ten", KeyA: "coinflip", KeyS: "pachinko", KeyD: "cashhunt", KeyF: "crazytime" };
      if (spotKeys[event.code]) {
        event.preventDefault();
        current.place(spotKeys[event.code]!);
      } else if (event.code === "KeyC") current.clearBets();
      else if (event.code === "KeyX") current.repeatBets();
      else if (event.code === "Space" || event.code === "Enter") {
        event.preventDefault();
        if (current.phase === "result") current.nextRound();
        else void current.launchSpin();
      }
    };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [panel]);

  const toggleFavorite = () => {
    const value = !favorite;
    setFavorite(value);
    try {
      localStorage.setItem("crazytols-favorite", String(value));
    } catch {
      /* optional preference */
    }
    notice(value ? "CRAZYTOLS added to your favorites." : "CRAZYTOLS removed from favorites.");
  };
  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
      else notice("Fullscreen is not supported on this browser.");
    } catch {
      notice("Your browser could not open fullscreen.");
    }
  };
  const stageStatus =
    game.phase === "result" && game.lastWin
      ? game.lastWin.amount > 0
        ? `You won ${game.denom.fmt(game.lastWin.amount)} ${game.denom.code}`
        : `${spotLabelLong(game.lastWin.spot)}. Give it another spin.`
      : game.phase === "spin" || game.phase === "landed"
        ? "Round in motion. Good luck."
        : game.phase === "topslot"
          ? "Finding your Top Slot multiplier..."
          : game.phase === "bonus"
            ? "Your bonus round is ready."
            : "Choose a spot. Let the wheel decide.";

  return (
    <div className="czt">
      <FxCanvas />
      <main className="platform-main">
        <div className="breadcrumb-row">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <Link to="/">Lobby</Link>
            <span>&middot;</span>
            <Link to="/casino">Casino</Link>
            <span>&middot;</span>
            <h1>CRAZYTOLS</h1>
          </nav>
          <div className="mode-label">
            <span className="status-dot" />
            {game.denom.code} table &middot; server-settled
          </div>
        </div>

        <div className="game-card" id="game" ref={tableRef}>
          <div className="game-body">
            <BetPanel game={game} autoSpin={autoSpin} onRules={() => setPanel("rules")} onAutoPlay={() => setPanel("autoplay")} />
            <section className={`wheel-stage ${game.phase === "result" && game.lastWin?.amount ? "win-stage" : ""}`} aria-label="CRAZYTOLS game">
              <TopSlotPill rolling={game.phase === "topslot"} paused={game.paused} result={game.topSlot} revealed={game.topRevealed} />
              <div className="wheel-area" ref={wheelRef}>
                <div className="wheel-sizer">
                  <WheelCanvas
                    key={game.generation}
                    spinToken={game.spinToken}
                    targetIndex={game.target}
                    duration={game.duration}
                    paused={game.paused || game.screen === "over"}
                    winner={game.winnerIdx}
                    onLand={game.handleLand}
                  />
                </div>
              </div>
              <div className="wheel-stage-bottom">
                <div className={`stage-status ${game.lastWin?.amount ? "positive-text" : ""}`} aria-live="polite">
                  {stageStatus}
                </div>
                {game.history.length > 0 && (
                  <div className="round-history" aria-label="Recent wheel results">
                    <span>Last</span>
                    {game.history.slice(0, 8).map((spot, index) => (
                      <span
                        key={`${game.round}-${index}`}
                        className="history-value"
                        title={spotLabelLong(spot)}
                        style={{ color: WHEEL_COLORS[spot], opacity: 1 - index * 0.07 }}
                      >
                        {historyLabel(spot)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="game-toolbar">
            <div className="toolbar-controls">
              <button className="icon-button" onClick={() => setPanel("settings")} aria-label="Game settings" title="Settings">
                <Icon name="settings" size={18} />
              </button>
              <button
                className={`icon-button favorite-button ${favorite ? "is-favorite" : ""}`}
                onClick={toggleFavorite}
                aria-pressed={favorite}
                aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
                title="Favorite"
              >
                <Icon name="star" size={19} />
              </button>
              <button
                className="icon-button"
                onClick={() => document.getElementById("activity")?.scrollIntoView({ behavior: "smooth" })}
                aria-label="View game statistics"
                title="Statistics"
              >
                <Icon name="chart" size={17} />
              </button>
              <div className="speed-control" role="group" aria-label="Spin speed">
                {([1, 2, "instant"] as const).map((value) => (
                  <button
                    key={value}
                    disabled={busy}
                    aria-pressed={speed === value}
                    className={speed === value ? "active" : ""}
                    onClick={() => setSpeed(value)}
                    title={value === "instant" ? "Instant animation" : `${value}x animation speed`}
                  >
                    {value === "instant" ? "INST" : `${value}x`}
                  </button>
                ))}
              </div>
              <button className="icon-button" onClick={() => game.setMuted(!game.muted)} aria-label={game.muted ? "Enable sound" : "Mute sound"} title={game.muted ? "Sound off (M)" : "Sound on (M)"}>
                <Icon name={game.muted ? "mute" : "sound"} size={19} />
              </button>
              <button className="icon-button pause-tool" onClick={() => game.setUserPaused(true)} disabled={game.screen !== "play"} aria-label="Pause game" title="Pause (P)">
                <Icon name="pause" size={16} />
              </button>
            </div>
            <TolsWordmark className="toolbar-wordmark" />
            <div className="toolbar-right">
              <button className="fairness-button" onClick={() => setPanel("fairness")}>
                <Icon name="shield" size={15} />
                <span>Fairness info</span>
              </button>
              <button className="icon-button fullscreen-button" onClick={() => void toggleFullscreen()} aria-label="Toggle fullscreen" title="Fullscreen">
                <Icon name="expand" size={16} />
              </button>
            </div>
          </div>
        </div>

        <ActivityTable records={game.records} scores={game.scores} onRules={() => setPanel("rules")} />
        <footer className="page-footer">
          <span>
            CRAZYTOLS <span className="footer-dot">&middot;</span> A TOLS Original
          </span>
          <button onClick={() => setPanel("responsible")}>
            Play responsibly <Icon name="heart" size={12} />
          </button>
        </footer>
      </main>

      {game.phase === "bonus" && game.screen === "play" && game.winner && (
        <BonusGame
          kind={game.winner}
          stake={game.bets[game.winner]}
          topMulti={game.topSlot?.spot === game.winner ? game.topSlot.multi : 1}
          paused={game.paused}
          server={game.bonus}
          onDone={game.finishBonus}
          onPause={() => game.setUserPaused(true)}
        />
      )}
      {panel && (
        <PlatformDialogs
          panel={panel}
          game={game}
          close={() => setPanel(null)}
          autoSpin={autoSpin}
          setAutoSpin={setAutoSpin}
          effects={effects}
          setEffects={setEffects}
          onCashier={onCashier}
        />
      )}
      {game.userPaused && !panel && (
        <Dialog title="Take your time." subtitle="Your game is paused. Everything is right where you left it." onClose={() => game.setUserPaused(false)}>
          <div className="pause-art">
            <Icon name="pause" size={38} />
          </div>
          <button className="primary-button" onClick={() => game.setUserPaused(false)}>
            <Icon name="play" size={16} />
            Resume game
          </button>
          <div className="dialog-actions">
            <button className="secondary-button" onClick={game.restart}>
              Reset table
            </button>
            <button className="secondary-button" onClick={game.cashOut} disabled={!game.canCashOut}>
              End session
            </button>
          </div>
          <p className="dialog-footnote">P or Escape to resume. Unsettled bets stay locked.</p>
        </Dialog>
      )}
      {game.screen === "over" && game.final && !panel && (
        <Dialog
          title={game.final.cashedOut ? "That's a wrap." : "Every spin is a fresh start."}
          subtitle={game.final.cashedOut ? "Session complete. Your best runs are saved locally." : "Out of balance? Top up from the wallet any time."}
          onClose={game.restart}
        >
          <div className="final-score">
            <span>FINAL SCORE</span>
            <strong>{game.denom.fmt(game.final.balance)}</strong>
            <p>
              {game.completed} rounds played &middot; Best multiplier {game.bestMulti}x
            </p>
          </div>
          <ScoreTable scores={game.scores.slice(0, 5)} highlight={game.final.stamp} />
          <button className="primary-button replay-button" onClick={game.restart}>
            <Icon name="repeat" size={17} />
            Play again
          </button>
          <p className="dialog-footnote">Your platform balance is untouched by resetting the table.</p>
        </Dialog>
      )}
      {toast && (
        <div className="toast" role="status">
          <Icon name="info" size={16} />
          <span>{toast}</span>
          <button aria-label="Dismiss notification" onClick={() => setToast("")}>
            <Icon name="close" size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

function spotLabelLong(spot: SpotId) {
  return ({ one: "1", two: "2", five: "5", ten: "10", coinflip: "Coin Flip", cashhunt: "Cash Hunt", pachinko: "Pachinko", crazytime: "CrazyTols" })[spot];
}
function historyLabel(spot: SpotId) {
  return ["one", "two", "five", "ten"].includes(spot)
    ? spotLabelLong(spot)
    : spot === "crazytime"
      ? "CT"
      : spot === "coinflip"
        ? "CF"
        : spot === "pachinko"
          ? "P"
          : "CH";
}
