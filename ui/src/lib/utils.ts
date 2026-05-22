import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { deriveAgentUrlKey, deriveProjectUrlKey, normalizeProjectUrlKey, hasNonAsciiContent } from "@paperclipai/shared";
import type { BillingType } from "@paperclipai/shared";
import { i18n, t } from "@/i18n";
import { getCurrency, getFxRate } from "./currency";

/** Active BCP-47 locale tag for Intl formatting — follows the chosen UI language. */
function activeLocale(): string {
  return i18n.language || "en";
}

/** Fixed display time zone — the Korean investor dashboard always shows KST. */
const DISPLAY_TIME_ZONE = "Asia/Seoul";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function asObject(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

export function asBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

export function asFiniteNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function formatCents(cents: number): string {
  const dollars = cents / 100;
  if (getCurrency() === "KRW") {
    return new Intl.NumberFormat(activeLocale(), {
      style: "currency",
      currency: "KRW",
      maximumFractionDigits: 0,
    }).format(dollars * getFxRate());
  }
  return new Intl.NumberFormat(activeLocale(), {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(dollars);
}

export function formatNumber(n: number): string {
  return n.toLocaleString(activeLocale());
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString(activeLocale(), {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: DISPLAY_TIME_ZONE,
  });
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString(activeLocale(), {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: DISPLAY_TIME_ZONE,
  });
}

export function formatShortDate(date: Date | string): string {
  return new Date(date).toLocaleString(activeLocale(), {
    month: "short",
    day: "numeric",
    timeZone: DISPLAY_TIME_ZONE,
  });
}

/** Locale-aware 24-hour clock time (KST). Pass `{ seconds: true }` to include seconds. */
export function formatTime(date: Date | string, opts?: { seconds?: boolean }): string {
  return new Date(date).toLocaleTimeString(activeLocale(), {
    hour: "2-digit",
    minute: "2-digit",
    ...(opts?.seconds ? { second: "2-digit" as const } : {}),
    hour12: false,
    timeZone: DISPLAY_TIME_ZONE,
  });
}

export function relativeTime(date: Date | string): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffSec = Math.round((now - then) / 1000);
  if (diffSec < 60) return t("time.justNow");
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return t("time.minutesAgo", { count: diffMin });
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return t("time.hoursAgo", { count: diffHr });
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 30) return t("time.daysAgo", { count: diffDay });
  return formatDate(date);
}

// Korean myriad number units — 만(10^4) · 억(10^8) · 조(10^12).
const KO_MAN = 10_000;
const KO_EOK = 100_000_000;
const KO_JO = 1_000_000_000_000;

export function formatTokens(n: number): string {
  if (activeLocale().startsWith("ko")) {
    if (n >= KO_JO) return `${(n / KO_JO).toFixed(1)}조`;
    if (n >= KO_EOK) return `${(n / KO_EOK).toFixed(1)}억`;
    if (n >= KO_MAN) return `${(n / KO_MAN).toFixed(1)}만`;
    return String(n);
  }
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

/** Humanize a millisecond duration into a compact `1h 2m`, `45m 12s`, `12s` string. */
export function formatDurationMs(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return "0s";
  const totalSeconds = Math.round(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes < 60) return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours < 24) {
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
}

/** Map a raw provider slug to a display-friendly name. */
export function providerDisplayName(provider: string): string {
  const map: Record<string, string> = {
    anthropic: "Anthropic",
    aws_bedrock: "AWS Bedrock",
    openai: "OpenAI",
    openrouter: "OpenRouter",
    chatgpt: "ChatGPT",
    google: "Google",
    cursor: "Cursor",
    jetbrains: "JetBrains AI",
  };
  return map[provider.toLowerCase()] ?? provider;
}

export function quotaSourceDisplayName(source: string): string {
  const map: Record<string, string> = {
    "anthropic-oauth": "Anthropic OAuth",
    "claude-cli": "Claude CLI",
    "bedrock": "AWS Bedrock",
    "codex-rpc": "Codex app server",
    "codex-wham": "ChatGPT WHAM",
  };
  return map[source] ?? source;
}

function coerceBillingType(value: unknown): BillingType | null {
  if (
    value === "metered_api" ||
    value === "subscription_included" ||
    value === "subscription_overage" ||
    value === "credits" ||
    value === "fixed" ||
    value === "unknown"
  ) {
    return value;
  }
  return null;
}

function readRunCostUsd(payload: Record<string, unknown> | null): number {
  if (!payload) return 0;
  for (const key of ["costUsd", "cost_usd", "total_cost_usd"] as const) {
    const value = payload[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return 0;
}

export function visibleRunCostUsd(
  usage: Record<string, unknown> | null,
  result: Record<string, unknown> | null = null,
): number {
  const billingType = coerceBillingType(usage?.billingType) ?? coerceBillingType(result?.billingType);
  if (billingType === "subscription_included") return 0;
  return readRunCostUsd(usage) || readRunCostUsd(result);
}

/** Build an issue URL using the human-readable identifier when available. */
export function issueUrl(issue: { id: string; identifier?: string | null }): string {
  return `/issues/${issue.identifier ?? issue.id}`;
}

/** Build an agent route URL using the short URL key when available. */
export function agentRouteRef(agent: { id: string; urlKey?: string | null; name?: string | null }): string {
  return agent.urlKey ?? deriveAgentUrlKey(agent.name, agent.id);
}

/** Build an agent URL using the short URL key when available. */
export function agentUrl(agent: { id: string; urlKey?: string | null; name?: string | null }): string {
  return `/agents/${agentRouteRef(agent)}`;
}

/** Build a project route reference, falling back to UUID when the derived key is ambiguous. */
export function projectRouteRef(project: { id: string; urlKey?: string | null; name?: string | null }): string {
  const key = project.urlKey ?? deriveProjectUrlKey(project.name, project.id);
  // Guard for rolling deploys or legacy data where the server returned a bare slug without UUID suffix.
  if (key === normalizeProjectUrlKey(project.name) && hasNonAsciiContent(project.name)) return project.id;
  return key;
}

/** Build a project URL using the short URL key when available. */
export function projectUrl(project: { id: string; urlKey?: string | null; name?: string | null }): string {
  return `/projects/${projectRouteRef(project)}`;
}

/** Build a project workspace URL scoped under its project. */
export function projectWorkspaceUrl(
  project: { id: string; urlKey?: string | null; name?: string | null },
  workspaceId: string,
): string {
  return `${projectUrl(project)}/workspaces/${workspaceId}`;
}
