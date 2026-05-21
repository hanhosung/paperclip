import { formatDateTime } from "./utils";

type RetryAwareRun = {
  status: string;
  retryOfRunId?: string | null;
  scheduledRetryAt?: string | Date | null;
  scheduledRetryAttempt?: number | null;
  scheduledRetryReason?: string | null;
  retryExhaustedReason?: string | null;
};

export type RunRetryStateSummary = {
  kind: "scheduled" | "exhausted" | "attempted";
  badgeLabel: string;
  tone: string;
  detail: string | null;
  secondary: string | null;
  retryOfRunId: string | null;
};

/**
 * Translator function shape (matches `useTranslation().t`). When omitted the
 * helpers fall back to English, keeping non-React callers and tests simple.
 */
type Translate = (key: string, options?: Record<string, unknown>) => string;

/** Maps internal retry-reason codes to i18n keys under `components.retry.*`. */
const RETRY_REASON_KEYS: Record<string, string> = {
  transient_failure: "components.retry.transientFailure",
  missing_issue_comment: "components.retry.missingIssueComment",
  process_lost: "components.retry.processLost",
  assignment_recovery: "components.retry.assignmentRecovery",
  issue_continuation_needed: "components.retry.issueContinuationNeeded",
  max_turns_continuation: "components.retry.maxTurnsContinuation",
};

/** English fallback labels used when no `t` translator is supplied. */
const RETRY_REASON_FALLBACK: Record<string, string> = {
  transient_failure: "Transient failure",
  missing_issue_comment: "Missing issue comment",
  process_lost: "Process lost",
  assignment_recovery: "Assignment recovery",
  issue_continuation_needed: "Continuation needed",
  max_turns_continuation: "Max-turn continuation",
};

function readNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function joinFragments(parts: Array<string | null>) {
  const filtered = parts.filter((part): part is string => Boolean(part));
  return filtered.length > 0 ? filtered.join(" · ") : null;
}

export function formatRetryReason(reason: string | null | undefined, t?: Translate) {
  const normalized = readNonEmptyString(reason);
  if (!normalized) return null;
  const key = RETRY_REASON_KEYS[normalized];
  if (key) return t ? t(key) : RETRY_REASON_FALLBACK[normalized] ?? normalized.replace(/_/g, " ");
  return normalized.replace(/_/g, " ");
}

export function describeRunRetryState(run: RetryAwareRun, t?: Translate): RunRetryStateSummary | null {
  const tr: Translate = t ?? ((key, options) => fallbackTranslate(key, options));
  const attempt =
    typeof run.scheduledRetryAttempt === "number" && Number.isFinite(run.scheduledRetryAttempt) && run.scheduledRetryAttempt > 0
      ? run.scheduledRetryAttempt
      : null;
  const attemptLabel = attempt ? tr("components.retry.attempt", { count: attempt }) : null;
  const reasonLabel = formatRetryReason(run.scheduledRetryReason, t);
  const retryOfRunId = readNonEmptyString(run.retryOfRunId);
  const exhaustedReason = readNonEmptyString(run.retryExhaustedReason);
  const dueAt = run.scheduledRetryAt ? formatDateTime(run.scheduledRetryAt) : null;
  const isMaxTurnContinuation = run.scheduledRetryReason === "max_turns_continuation";
  const hasRetryMetadata =
    Boolean(retryOfRunId)
    || Boolean(reasonLabel)
    || Boolean(dueAt)
    || Boolean(attemptLabel)
    || Boolean(exhaustedReason);

  if (!hasRetryMetadata) return null;

  if (run.status === "scheduled_retry") {
    return {
      kind: "scheduled",
      badgeLabel: isMaxTurnContinuation
        ? tr("components.retry.continuationScheduled")
        : tr("components.retry.retryScheduled"),
      tone: "border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
      detail: joinFragments([attemptLabel, reasonLabel]),
      secondary: dueAt
        ? isMaxTurnContinuation
          ? tr("components.retry.nextContinuation", { time: dueAt })
          : tr("components.retry.nextRetry", { time: dueAt })
        : isMaxTurnContinuation
          ? tr("components.retry.nextContinuationPending")
          : tr("components.retry.nextRetryPending"),
      retryOfRunId,
    };
  }

  if (exhaustedReason) {
    return {
      kind: "exhausted",
      badgeLabel: isMaxTurnContinuation
        ? tr("components.retry.continuationExhausted")
        : tr("components.retry.retryExhausted"),
      tone: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
      detail: joinFragments([attemptLabel, reasonLabel, tr("components.retry.automaticRetriesExhausted")]),
      secondary: exhaustedReason.includes("Manual intervention required")
        ? exhaustedReason
        : tr("components.retry.manualInterventionRequired", { reason: exhaustedReason }),
      retryOfRunId,
    };
  }

  return {
    kind: "attempted",
    badgeLabel: isMaxTurnContinuation
      ? tr("components.retry.continuedRun")
      : tr("components.retry.retriedRun"),
    tone: "border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-300",
    detail: joinFragments([attemptLabel, reasonLabel]),
    secondary: null,
    retryOfRunId,
  };
}

/** English fallback used by `describeRunRetryState` when no `t` is supplied. */
function fallbackTranslate(key: string, options?: Record<string, unknown>): string {
  const count = typeof options?.count === "number" ? options.count : undefined;
  switch (key) {
    case "components.retry.attempt":
      return `Attempt ${count}`;
    case "components.retry.continuationScheduled":
      return "Continuation scheduled";
    case "components.retry.retryScheduled":
      return "Retry scheduled";
    case "components.retry.continuationExhausted":
      return "Continuation exhausted";
    case "components.retry.retryExhausted":
      return "Retry exhausted";
    case "components.retry.continuedRun":
      return "Continued run";
    case "components.retry.retriedRun":
      return "Retried run";
    case "components.retry.automaticRetriesExhausted":
      return "Automatic retries exhausted";
    case "components.retry.nextContinuation":
      return `Next continuation ${options?.time ?? ""}`;
    case "components.retry.nextRetry":
      return `Next retry ${options?.time ?? ""}`;
    case "components.retry.nextContinuationPending":
      return "Next continuation pending schedule";
    case "components.retry.nextRetryPending":
      return "Next retry pending schedule";
    case "components.retry.manualInterventionRequired":
      return `${options?.reason ?? ""} Manual intervention required.`;
    default:
      return key;
  }
}
