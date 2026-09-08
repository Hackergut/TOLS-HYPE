const KEY = "tols-responsible";

export type ResponsibleSettings = {
  excludedUntil: number | null;
  depositLimit: number | null;
  wagerLimit: number | null;
  lossLimit: number | null;
  sessionMinutes: number | null;
};

const EMPTY: ResponsibleSettings = {
  excludedUntil: null,
  depositLimit: null,
  wagerLimit: null,
  lossLimit: null,
  sessionMinutes: null,
};

export function loadResponsible(): ResponsibleSettings {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    return { ...EMPTY, ...JSON.parse(raw) };
  } catch {
    return EMPTY;
  }
}

export function saveResponsible(next: ResponsibleSettings) {
  window.localStorage.setItem(KEY, JSON.stringify(next));
}

export function isSelfExcluded(settings: ResponsibleSettings = loadResponsible()) {
  return Boolean(settings.excludedUntil && settings.excludedUntil > Date.now());
}
