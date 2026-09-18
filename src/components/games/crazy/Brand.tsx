export const TOLS_PATH = "M0,12H192V96H144V192H48V96H0Z M12,24V84H60V180H132V84H180V24Z";

export function TolsMark({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 192 204" fill="currentColor" aria-hidden="true">
      <path d={TOLS_PATH} fillRule="evenodd" />
    </svg>
  );
}

export function TolsWordmark({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 42" fill="none" stroke="currentColor" strokeWidth="1.35" aria-label="TOLS" role="img">
      <path d="M2 3H23V10H16V39H9V10H2Z" />
      <path d="M36 3C28 3 28 7 28 12V30C28 37 30 39 36 39C43 39 45 36 45 30V12C45 5 42 3 36 3Z M35 11H38V31H35Z" />
      <path d="M52 3H59V32H69V39H52Z" />
      <path d="M82 3C76 3 73 6 73 12V17C73 22 77 24 83 27C86 28 87 29 87 31C87 34 81 34 81 30V28H73V31C73 37 77 39 84 39C92 39 95 36 95 30V26C95 20 89 18 84 16C81 15 81 14 81 11C81 8 87 8 87 12V14H95V11C95 5 89 3 82 3Z" />
    </svg>
  );
}

export function SolanaCoin({ className = "" }: { className?: string }) {
  return (
    <span className={`solana-coin ${className}`} aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="m6.4 5.5 1.7-1.7h11.6l-1.8 1.7H6.4Zm0 5.2L4.7 9h11.6l1.8 1.7H6.4Zm0 5.2 1.7-1.7h11.6l-1.8 1.7H6.4Z" transform="translate(0 2)" />
      </svg>
    </span>
  );
}