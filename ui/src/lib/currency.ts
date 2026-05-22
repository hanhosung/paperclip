import { i18n } from "@/i18n";

/** localStorage keys for the chosen display currency and manual FX rate. */
export const CURRENCY_STORAGE_KEY = "paperclip.currency";
export const FX_RATE_STORAGE_KEY = "paperclip.fxRate";

export type Currency = "USD" | "KRW";
export const SUPPORTED_CURRENCIES: readonly Currency[] = ["USD", "KRW"];
export const DEFAULT_CURRENCY: Currency = "USD";
/** Seed USD→KRW rate. Manual and user-editable — this is only the first value. */
export const DEFAULT_FX_RATE = 1400;

function isCurrency(value: string | null | undefined): value is Currency {
  return value === "USD" || value === "KRW";
}

function resolveInitialCurrency(): Currency {
  try {
    const saved = window.localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (isCurrency(saved)) return saved;
  } catch {
    // localStorage unavailable — fall through to default
  }
  return DEFAULT_CURRENCY;
}

function resolveInitialFxRate(): number {
  try {
    const saved = Number(window.localStorage.getItem(FX_RATE_STORAGE_KEY));
    if (Number.isFinite(saved) && saved > 0) return saved;
  } catch {
    // localStorage unavailable — fall through to default
  }
  return DEFAULT_FX_RATE;
}

let currentCurrency: Currency = resolveInitialCurrency();
let currentFxRate: number = resolveInitialFxRate();

export function getCurrency(): Currency {
  return currentCurrency;
}

export function getFxRate(): number {
  return currentFxRate;
}

/**
 * Re-emit `languageChanged` so every component bound to react-i18next
 * re-renders and re-runs the currency formatters. Currency changes are rare
 * (a settings action), so an app-wide refresh is acceptable — and it mirrors
 * how a locale change already propagates.
 */
function notifyChange(): void {
  void i18n.changeLanguage(i18n.language);
}

/** Switch the display currency and persist the choice. */
export function setCurrency(currency: Currency): void {
  if (!isCurrency(currency) || currency === currentCurrency) return;
  currentCurrency = currency;
  try {
    window.localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
  } catch {
    // ignore persistence failure — currency still changes for this session
  }
  notifyChange();
}

/** Update the manual USD→KRW exchange rate and persist it. */
export function setFxRate(rate: number): void {
  if (!Number.isFinite(rate) || rate <= 0 || rate === currentFxRate) return;
  currentFxRate = rate;
  try {
    window.localStorage.setItem(FX_RATE_STORAGE_KEY, String(rate));
  } catch {
    // ignore persistence failure — rate still changes for this session
  }
  notifyChange();
}
