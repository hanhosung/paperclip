/**
 * enum-labels — single source of truth mapping issue enum values to i18n keys.
 *
 * Issue status / priority / field names appear across many surfaces (lists,
 * board columns, filters, chart legends, sort & group menus). They must all
 * translate identically. Components resolve the label with their own
 * `t()` from `useTranslation()`:  `t(issueStatusKey(issue.status))`.
 *
 * Canonical value lists live in `@paperclipai/shared` (ISSUE_STATUSES,
 * ISSUE_PRIORITIES). Translations live under `status.*` / `priority.*` /
 * `field.*` in the locale files — see wiki/runbooks/localization-glossary.md.
 */

/** i18n key for an issue workflow status (`backlog` … `cancelled`). */
export function issueStatusKey(status: string): string {
  return `status.${status}`;
}

/** i18n key for an issue priority (`critical` | `high` | `medium` | `low`). */
export function issuePriorityKey(priority: string): string {
  return `priority.${priority}`;
}

/** i18n key for a sort / group / column field name (`workflow`, `status`, …). */
export function fieldKey(field: string): string {
  return `field.${field}`;
}

/** i18n key for a project status (`backlog` | `planned` | `in_progress` | `completed` | `cancelled`). */
export function projectStatusKey(status: string): string {
  return `projectStatus.${status}`;
}

/** i18n key for a billing type (`metered_api`, `subscription_included`, …). */
export function billingTypeKey(billingType: string): string {
  return `billingType.${billingType}`;
}

/** i18n key for a finance event kind (`inference_charge`, `platform_fee`, …). */
export function financeEventKindKey(eventKind: string): string {
  return `financeEventKind.${eventKind}`;
}

/** i18n key for a finance direction (`debit` | `credit`). */
export function financeDirectionKey(direction: string): string {
  return `financeDirection.${direction}`;
}

/** i18n key for a goal status (`planned` | `active` | `achieved` | `cancelled`). */
export function goalStatusKey(status: string): string {
  return `goalStatus.${status}`;
}

/** i18n key for a goal level (`company` | `team` | `agent` | `task`). */
export function goalLevelKey(level: string): string {
  return `goalLevel.${level}`;
}

/** i18n key for a routine lifecycle status (`active` | `paused` | `archived` | `draft`). */
export function routineStatusKey(status: string): string {
  return `routineStatus.${status}`;
}

/** i18n key for a routine run status (`succeeded`, `failed`, `coalesced`, …). */
export function routineRunStatusKey(status: string): string {
  return `routineRunStatus.${status}`;
}

/** i18n key for a routine concurrency policy (`coalesce_if_active`, …). */
export function routineConcurrencyPolicyKey(policy: string): string {
  return `routinePolicy.concurrency.${policy}`;
}

/** i18n key for a routine catch-up policy (`skip_missed`, `enqueue_missed_with_cap`). */
export function routineCatchUpPolicyKey(policy: string): string {
  return `routinePolicy.catchUp.${policy}`;
}
