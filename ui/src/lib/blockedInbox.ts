import type { TFunction } from "i18next";
import type {
  Issue,
  IssueBlockedInboxAttention,
  IssueBlockedInboxReason,
  IssueBlockedInboxSeverity,
} from "@paperclipai/shared";

export type BlockedReasonVariant =
  | "needs_decision"
  | "stalled"
  | "needs_attention"
  | "recovery_required"
  | "external_wait"
  | "owner_paused";

const VARIANT_BY_REASON: Record<IssueBlockedInboxReason, BlockedReasonVariant> = {
  pending_board_decision: "needs_decision",
  pending_user_decision: "needs_decision",
  missing_successful_run_disposition: "needs_decision",
  blocked_chain_stalled: "stalled",
  blocked_by_unassigned_issue: "needs_attention",
  blocked_by_assigned_backlog_issue: "needs_attention",
  blocked_by_cancelled_issue: "needs_attention",
  in_review_without_action_path: "needs_attention",
  invalid_review_participant: "needs_attention",
  open_recovery_issue: "recovery_required",
  external_owner_action: "external_wait",
  blocked_by_uninvokable_assignee: "owner_paused",
};

/** Set of known reasons — used to decide the `stopped` fallback key. */
const REASON_KEYS = new Set<IssueBlockedInboxReason>(
  Object.keys(VARIANT_BY_REASON) as IssueBlockedInboxReason[],
);

export const BLOCKED_REASON_VARIANT_ORDER: BlockedReasonVariant[] = [
  "needs_decision",
  "stalled",
  "needs_attention",
  "recovery_required",
  "external_wait",
  "owner_paused",
];

const SEVERITY_RANK: Record<IssueBlockedInboxSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export type BlockedInboxBadgeTone = "muted" | "amber" | "red";

export function blockedReasonVariant(reason: IssueBlockedInboxReason): BlockedReasonVariant {
  return VARIANT_BY_REASON[reason] ?? "needs_attention";
}

/**
 * i18n key for a blocked-inbox reason. Falls back to the `stopped` key for
 * unknown reasons. Callers resolve with `t()` from `useTranslation()`.
 */
export function blockedReasonKey(reason: IssueBlockedInboxReason): string {
  return REASON_KEYS.has(reason)
    ? `blockedInbox.reason.${reason}`
    : "blockedInbox.reason.stopped";
}

/** i18n key for a blocked-inbox reason variant. */
export function blockedVariantKey(variant: BlockedReasonVariant): string {
  return `blockedInbox.variant.${variant}`;
}

export function blockedSeverityRank(severity: IssueBlockedInboxSeverity): number {
  return SEVERITY_RANK[severity] ?? 9;
}

export function compareBlockedAttention(
  a: IssueBlockedInboxAttention,
  b: IssueBlockedInboxAttention,
): number {
  const sevDiff = blockedSeverityRank(a.severity) - blockedSeverityRank(b.severity);
  if (sevDiff !== 0) return sevDiff;
  const aSince = a.stoppedSinceAt ? new Date(a.stoppedSinceAt).getTime() : Number.POSITIVE_INFINITY;
  const bSince = b.stoppedSinceAt ? new Date(b.stoppedSinceAt).getTime() : Number.POSITIVE_INFINITY;
  const sinceDiff = aSince - bSince;
  return Number.isFinite(sinceDiff) ? sinceDiff : 0;
}

export interface BlockedInboxIssueRow {
  issue: Issue;
  attention: IssueBlockedInboxAttention;
  variant: BlockedReasonVariant;
  /** Resolved, localized reason label — also used for search matching. */
  reasonLabel: string;
  stoppedAtMs: number | null;
}

export type BlockedInboxGroupBy = "blocker_type" | "none";
export type BlockedInboxSort = "urgency" | "most_recent" | "longest_stopped";

/** `[value, i18nKey]` — callers resolve the key with `t()`. */
export const BLOCKED_GROUP_OPTIONS: readonly [BlockedInboxGroupBy, string][] = [
  ["blocker_type", "blockedInbox.groupBy.blocker_type"],
  ["none", "blockedInbox.groupBy.none"],
];

/** `[value, i18nKey]` — callers resolve the key with `t()`. */
export const BLOCKED_SORT_OPTIONS: readonly [BlockedInboxSort, string][] = [
  ["urgency", "blockedInbox.sort.urgency"],
  ["most_recent", "blockedInbox.sort.most_recent"],
  ["longest_stopped", "blockedInbox.sort.longest_stopped"],
];

export interface BlockedInboxGroup {
  variant: BlockedReasonVariant;
  /** i18n key for the group label — the view resolves it with `t()`. */
  label: string;
  rows: BlockedInboxIssueRow[];
}

/**
 * Build display rows. `t` resolves each row's `reasonLabel` to the active
 * locale so it stays visible and searchable (see `blockedRowMatchesSearch`).
 */
export function buildBlockedInboxRows(
  issues: readonly Issue[],
  t: TFunction,
): BlockedInboxIssueRow[] {
  const rows: BlockedInboxIssueRow[] = [];
  for (const issue of issues) {
    const attention = issue.blockedInboxAttention;
    if (!attention) continue;
    rows.push({
      issue,
      attention,
      variant: blockedReasonVariant(attention.reason),
      reasonLabel: t(blockedReasonKey(attention.reason)),
      stoppedAtMs: attention.stoppedSinceAt ? new Date(attention.stoppedSinceAt).getTime() : null,
    });
  }
  return rows;
}

function issueTimestampMs(value: Date | string | null | undefined): number | null {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

function blockedRowRecencyMs(row: BlockedInboxIssueRow): number {
  return row.stoppedAtMs ?? issueTimestampMs(row.issue.updatedAt) ?? 0;
}

function compareBlockedRowsByTitle(a: BlockedInboxIssueRow, b: BlockedInboxIssueRow): number {
  const byTitle = a.issue.title.localeCompare(b.issue.title);
  if (byTitle !== 0) return byTitle;
  return a.issue.id.localeCompare(b.issue.id);
}

export function compareBlockedRows(
  a: BlockedInboxIssueRow,
  b: BlockedInboxIssueRow,
  sort: BlockedInboxSort = "urgency",
): number {
  if (sort === "most_recent") {
    const recencyDiff = blockedRowRecencyMs(b) - blockedRowRecencyMs(a);
    if (recencyDiff !== 0) return recencyDiff;
    const attentionDiff = compareBlockedAttention(a.attention, b.attention);
    if (attentionDiff !== 0) return attentionDiff;
    return compareBlockedRowsByTitle(a, b);
  }

  if (sort === "longest_stopped") {
    const aStopped = a.stoppedAtMs ?? Number.POSITIVE_INFINITY;
    const bStopped = b.stoppedAtMs ?? Number.POSITIVE_INFINITY;
    const stoppedDiff = aStopped - bStopped;
    if (stoppedDiff !== 0) return stoppedDiff;
    const severityDiff = blockedSeverityRank(a.attention.severity) - blockedSeverityRank(b.attention.severity);
    if (severityDiff !== 0) return severityDiff;
    return compareBlockedRowsByTitle(a, b);
  }

  const attentionDiff = compareBlockedAttention(a.attention, b.attention);
  if (attentionDiff !== 0) return attentionDiff;
  const recencyDiff = blockedRowRecencyMs(b) - blockedRowRecencyMs(a);
  if (recencyDiff !== 0) return recencyDiff;
  return compareBlockedRowsByTitle(a, b);
}

export function sortBlockedInboxRows(
  rows: readonly BlockedInboxIssueRow[],
  sort: BlockedInboxSort = "urgency",
): BlockedInboxIssueRow[] {
  return [...rows].sort((a, b) => compareBlockedRows(a, b, sort));
}

export function groupBlockedInboxRows(
  rows: readonly BlockedInboxIssueRow[],
  sort: BlockedInboxSort = "urgency",
): BlockedInboxGroup[] {
  const buckets = new Map<BlockedReasonVariant, BlockedInboxIssueRow[]>();
  for (const row of rows) {
    const list = buckets.get(row.variant) ?? [];
    list.push(row);
    buckets.set(row.variant, list);
  }
  const groups: BlockedInboxGroup[] = [];
  for (const variant of BLOCKED_REASON_VARIANT_ORDER) {
    const list = buckets.get(variant);
    if (!list || list.length === 0) continue;
    const sorted = sortBlockedInboxRows(list, sort);
    groups.push({ variant, label: blockedVariantKey(variant), rows: sorted });
  }
  return groups;
}

export function blockedRowMatchesSearch(row: BlockedInboxIssueRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    row.issue.title,
    row.issue.identifier ?? "",
    row.attention.owner.label ?? "",
    row.attention.action.label,
    row.attention.action.detail ?? "",
    row.reasonLabel,
    row.attention.leafIssue?.identifier ?? "",
    row.attention.leafIssue?.title ?? "",
    row.attention.recoveryIssue?.identifier ?? "",
    row.attention.recoveryIssue?.title ?? "",
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

export function blockedBadgeTone(rows: readonly BlockedInboxIssueRow[]): BlockedInboxBadgeTone {
  if (rows.length === 0) return "muted";
  let highest: IssueBlockedInboxSeverity = "low";
  for (const row of rows) {
    if (blockedSeverityRank(row.attention.severity) < blockedSeverityRank(highest)) {
      highest = row.attention.severity;
    }
  }
  if (highest === "critical") return "red";
  if (highest === "high") return "amber";
  return "muted";
}

/** Localized "stopped …" age label. `t` resolves the `blockedInbox.stopped.*` keys. */
export function formatStoppedAge(
  stoppedSinceAt: string | null,
  t: TFunction,
  now: number = Date.now(),
): string {
  if (!stoppedSinceAt) return t("blockedInbox.stopped.unknown");
  const then = new Date(stoppedSinceAt).getTime();
  if (!Number.isFinite(then)) return t("blockedInbox.stopped.unknown");
  const seconds = Math.max(0, Math.round((now - then) / 1000));
  if (seconds < 60) return t("blockedInbox.stopped.justNow");
  if (seconds < 3600) {
    return t("blockedInbox.stopped.minutes", { count: Math.floor(seconds / 60) });
  }
  if (seconds < 86_400) {
    return t("blockedInbox.stopped.hours", { count: Math.floor(seconds / 3600) });
  }
  if (seconds < 86_400 * 7) {
    return t("blockedInbox.stopped.days", { count: Math.floor(seconds / 86_400) });
  }
  if (seconds < 86_400 * 30) {
    return t("blockedInbox.stopped.weeks", { count: Math.floor(seconds / (86_400 * 7)) });
  }
  return t("blockedInbox.stopped.months", { count: Math.floor(seconds / (86_400 * 30)) });
}
