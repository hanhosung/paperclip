import { useState } from "react";
import { useTranslation } from "@/i18n";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getCurrency,
  getFxRate,
  setCurrency,
  setFxRate,
  SUPPORTED_CURRENCIES,
  type Currency,
} from "@/lib/currency";

/** Display-currency picker plus a user-editable manual USD→KRW exchange rate. */
export function CurrencySelector({ id }: { id?: string }) {
  const { t } = useTranslation();
  const [currency, setCurrencyState] = useState<Currency>(getCurrency());
  const [fxRateText, setFxRateText] = useState(() => String(getFxRate()));

  function commitFxRate() {
    const parsed = Number(fxRateText);
    if (Number.isFinite(parsed) && parsed > 0) {
      setFxRate(parsed);
      setFxRateText(String(parsed));
    } else {
      setFxRateText(String(getFxRate()));
    }
  }

  return (
    <div className="space-y-3">
      <Select
        value={currency}
        onValueChange={(value) => {
          const next = value as Currency;
          setCurrencyState(next);
          setCurrency(next);
        }}
      >
        <SelectTrigger id={id} className="w-full md:w-72">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SUPPORTED_CURRENCIES.map((code) => (
            <SelectItem key={code} value={code}>
              {t(`settings.currency.option.${code}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="space-y-1.5">
        <Label htmlFor="currency-fx-rate" className="text-xs text-muted-foreground">
          {t("settings.currency.fxRateLabel")}
        </Label>
        <Input
          id="currency-fx-rate"
          type="number"
          inputMode="decimal"
          min={0}
          step="1"
          value={fxRateText}
          onChange={(event) => setFxRateText(event.target.value)}
          onBlur={commitFxRate}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
          }}
          className="w-full md:w-72"
        />
        <p className="text-xs text-muted-foreground">
          {t("settings.currency.fxRateDescription")}
        </p>
      </div>
    </div>
  );
}
