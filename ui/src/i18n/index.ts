import i18n, { type InitOptions, type TOptions } from "i18next";
import { initReactI18next, useTranslation as useReactI18nextTranslation } from "react-i18next";

import { DEFAULT_LOCALE, i18nextResources, supportedLocales } from "./locales";

/** localStorage key for the user's chosen locale (mirrors `paperclip.theme`). */
export const LOCALE_STORAGE_KEY = "paperclip.locale";

function isSupported(value: string | null | undefined): boolean {
  return typeof value === "string" && supportedLocales.includes(value);
}

/** Resolve the startup locale: saved choice → browser language → default. */
function resolveInitialLocale(): string {
  try {
    const saved = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (saved && isSupported(saved)) return saved;
  } catch {
    // localStorage unavailable — fall through to browser detection
  }
  const candidates = typeof navigator !== "undefined"
    ? navigator.languages ?? [navigator.language]
    : [];
  for (const lang of candidates) {
    if (isSupported(lang)) return lang;
    const base = lang.split("-")[0];
    if (base && isSupported(base)) return base;
  }
  return DEFAULT_LOCALE;
}

const initialLocale = resolveInitialLocale();

const i18nextOptions: InitOptions = {
  resources: i18nextResources,
  lng: initialLocale,
  fallbackLng: DEFAULT_LOCALE,
  supportedLngs: supportedLocales,
  defaultNS: "translation",
  interpolation: { escapeValue: false },
  returnObjects: false,
  initAsync: false,
};

void i18n.use(initReactI18next).init(i18nextOptions).catch((error: unknown) => {
  console.error("Failed to initialize i18next", error);
});

/** Keep the <html lang> attribute aligned with the active locale. */
function syncDocumentLang(locale: string) {
  if (typeof document !== "undefined") {
    document.documentElement.lang = locale;
  }
}

syncDocumentLang(initialLocale);
i18n.on("languageChanged", syncDocumentLang);

/** Switch the active locale and persist the choice to localStorage. */
export async function setLocale(locale: string): Promise<void> {
  if (!supportedLocales.includes(locale)) return;
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // ignore persistence failure — language still changes for this session
  }
  await i18n.changeLanguage(locale);
}

export function t(key: string, options: TOptions = {}) {
  return i18n.t(key, options);
}

export const useTranslation = useReactI18nextTranslation;
export { i18n, supportedLocales, DEFAULT_LOCALE };
