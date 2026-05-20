import { useTranslation, setLocale, supportedLocales } from "@/i18n";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Native display name for a locale, e.g. "ko" → "한국어", "en" → "English". */
function localeLabel(locale: string): string {
  try {
    const native = new Intl.DisplayNames([locale], { type: "language" }).of(locale);
    if (native) return native.charAt(0).toUpperCase() + native.slice(1);
  } catch {
    // Intl.DisplayNames unavailable for this locale — fall back to the code
  }
  return locale;
}

const LOCALE_OPTIONS = [...supportedLocales]
  .map((locale) => ({ locale, label: localeLabel(locale) }))
  .sort((a, b) => a.label.localeCompare(b.label));

/** Locale picker — changes the active language immediately and persists it. */
export function LanguageSelector({ id }: { id?: string }) {
  const { i18n } = useTranslation();

  return (
    <Select
      value={i18n.language}
      onValueChange={(value) => {
        void setLocale(value);
      }}
    >
      <SelectTrigger id={id} className="w-full md:w-72">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {LOCALE_OPTIONS.map(({ locale, label }) => (
          <SelectItem key={locale} value={locale}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
