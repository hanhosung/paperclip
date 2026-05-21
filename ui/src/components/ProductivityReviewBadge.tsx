import { Eye } from "lucide-react";
import type { IssueProductivityReview } from "@paperclipai/shared";
import { useTranslation } from "@/i18n";
import { Link } from "../lib/router";
import { cn } from "../lib/utils";
import { createIssueDetailPath } from "../lib/issueDetailBreadcrumb";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

const TRIGGER_LABEL_KEYS: Record<string, string> = {
  no_comment_streak: "components.productivityReview.triggerNoCommentStreak",
  long_active_duration: "components.productivityReview.triggerLongActiveDuration",
  high_churn: "components.productivityReview.triggerHighChurn",
};

const REVIEW_STATUS_LABEL_KEYS: Record<string, string> = {
  todo: "components.productivityReview.statusOpen",
  in_progress: "components.productivityReview.statusInProgress",
  in_review: "components.productivityReview.statusInReview",
  blocked: "components.productivityReview.statusBlocked",
  backlog: "components.productivityReview.statusOpen",
};

/** i18n key for a productivity-review trigger; defaults to the generic label. */
export function productivityReviewTriggerLabelKey(
  trigger: IssueProductivityReview["trigger"],
): string {
  if (!trigger) return "components.productivityReview.triggerDefault";
  return TRIGGER_LABEL_KEYS[trigger] ?? "components.productivityReview.triggerDefault";
}

export function ProductivityReviewBadge({
  review,
  className,
  hideLabel = false,
}: {
  review: IssueProductivityReview;
  className?: string;
  hideLabel?: boolean;
}) {
  const { t } = useTranslation();
  const label = t(productivityReviewTriggerLabelKey(review.trigger));
  const reviewIdentifier = review.reviewIdentifier ?? review.reviewIssueId.slice(0, 8);
  const reviewPath = createIssueDetailPath(review.reviewIdentifier ?? review.reviewIssueId);
  const statusLabelKey = REVIEW_STATUS_LABEL_KEYS[review.status];
  const statusLabel = statusLabelKey ? t(statusLabelKey) : review.status.replace(/_/g, " ");

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          to={reviewPath}
          className={cn(
            "inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300 shrink-0 hover:bg-amber-500/20 transition-colors",
            className,
          )}
          aria-label={t("components.productivityReview.ariaLabel", { identifier: reviewIdentifier, label })}
        >
          <Eye className="h-3 w-3" aria-hidden />
          {hideLabel ? null : <span>{t("components.productivityReview.underReview")}</span>}
        </Link>
      </TooltipTrigger>
      <TooltipContent>
        <div className="space-y-1 text-xs">
          <div className="font-semibold">{t("components.productivityReview.tooltipTitle")}</div>
          <div>
            <span className="text-muted-foreground">
              {t("components.productivityReview.tooltipTrigger")}
            </span>{" "}
            {label}
          </div>
          {typeof review.noCommentStreak === "number" && review.noCommentStreak > 0 ? (
            <div>
              <span className="text-muted-foreground">
                {t("components.productivityReview.tooltipNoCommentStreak")}
              </span>{" "}
              {t("components.productivityReview.tooltipRuns", { count: review.noCommentStreak })}
            </div>
          ) : null}
          <div>
            <span className="text-muted-foreground">
              {t("components.productivityReview.tooltipReview")}
            </span>{" "}
            {reviewIdentifier} ({statusLabel})
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
