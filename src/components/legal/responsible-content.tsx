import { Link } from "@tanstack/react-router";
import { AgeDisclaimerCard } from "@/components/legal/age-disclaimer-card";

export function ResponsibleContent() {
  return (
    <>
      <h1>Responsible Gambling</h1>
      <div className="not-typeset mb-8">
        <AgeDisclaimerCard />
      </div>
      <p>
        TOLS Casino is committed to responsible gaming. Gambling should be
        entertainment, not a way to make money.
      </p>
      <p>
        <strong>18+ only.</strong> TOLS Casino is restricted to players aged 18
        or over — or the minimum legal age in your jurisdiction, whichever is
        higher. Gambling under the legal age is a breach of these terms;
        accounts are verified and closed when it is detected. If you share a
        device, use parental controls to keep the games away from minors.
      </p>

      <h2>Tools Available</h2>
      <p>You can set the following limits from your profile:</p>
      <ul>
        <li>
          <strong>Self-exclusion</strong> — block yourself from playing for a
          set period.
        </li>
        <li>
          <strong>Deposit limit</strong> — cap how much you can deposit per
          day/week/month.
        </li>
        <li>
          <strong>Wager limit</strong> — cap how much you can bet per period.
        </li>
        <li>
          <strong>Loss limit</strong> — cap your net losses per period.
        </li>
        <li>
          <strong>Session limit</strong> — limit how long you play per session.
        </li>
      </ul>
      <p>
        Open{" "}
        <Link to="/profile" className="not-typeset text-primary">
          your profile
        </Link>{" "}
        to apply these tools. Self-exclusion takes effect immediately.
      </p>

      <h2>Need Help?</h2>
      <p>
        If gambling is affecting your life, contact{" "}
        <a href="https://www.begambleaware.org/" rel="noreferrer" target="_blank">
          BeGambleAware
        </a>{" "}
        or{" "}
        <a href="https://www.gamblersanonymous.org/" rel="noreferrer" target="_blank">
          Gamblers Anonymous
        </a>
        .
      </p>
      <p>
        You can also email{" "}
        <a href="mailto:support@tols.fun">support@tols.fun</a> to request
        account closure or a cooling-off period. See also our{" "}
        <Link to="/terms" className="not-typeset text-primary">
          Terms of Service
        </Link>
        .
      </p>
    </>
  );
}
