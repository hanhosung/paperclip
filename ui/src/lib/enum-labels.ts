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
