import { Database, Gauge, ReceiptText } from "lucide-react";
import { useTranslation } from "@/i18n";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const SURFACES = [
  {
    titleKey: "components.accountingModel.inferenceTitle",
    descriptionKey: "components.accountingModel.inferenceDesc",
    icon: Database,
    pointKeys: [
      "components.accountingModel.inferencePoint1",
      "components.accountingModel.inferencePoint2",
      "components.accountingModel.inferencePoint3",
    ],
    tone: "from-sky-500/12 via-sky-500/6 to-transparent",
  },
  {
    titleKey: "components.accountingModel.financeTitle",
    descriptionKey: "components.accountingModel.financeDesc",
    icon: ReceiptText,
    pointKeys: [
      "components.accountingModel.financePoint1",
      "components.accountingModel.financePoint2",
      "components.accountingModel.financePoint3",
    ],
    tone: "from-amber-500/14 via-amber-500/6 to-transparent",
  },
  {
    titleKey: "components.accountingModel.quotaTitle",
    descriptionKey: "components.accountingModel.quotaDesc",
    icon: Gauge,
    pointKeys: [
      "components.accountingModel.quotaPoint1",
      "components.accountingModel.quotaPoint2",
      "components.accountingModel.quotaPoint3",
    ],
    tone: "from-emerald-500/14 via-emerald-500/6 to-transparent",
  },
] as const;

export function AccountingModelCard() {
  const { t } = useTranslation();
  return (
    <Card className="relative overflow-hidden border-border/70">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(244,114,182,0.08),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.1),transparent_32%)]" />
      <CardHeader className="relative px-5 pt-5 pb-2">
        <CardTitle className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          {t("components.accountingModel.title")}
        </CardTitle>
        <CardDescription className="max-w-2xl text-sm leading-6">
          {t("components.accountingModel.description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="relative grid gap-3 px-5 pb-5 md:grid-cols-3">
        {SURFACES.map((surface) => {
          const Icon = surface.icon;
          return (
            <div
              key={surface.titleKey}
              className={`rounded-2xl border border-border/70 bg-gradient-to-br ${surface.tone} p-4 shadow-sm`}
            >
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-background/80">
                  <Icon className="h-4 w-4 text-foreground" />
                </div>
                <div>
                  <div className="text-sm font-semibold">{t(surface.titleKey)}</div>
                  <div className="text-xs text-muted-foreground">{t(surface.descriptionKey)}</div>
                </div>
              </div>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                {surface.pointKeys.map((pointKey) => (
                  <div key={pointKey}>{t(pointKey)}</div>
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
