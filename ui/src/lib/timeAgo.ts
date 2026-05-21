import { t } from "@/i18n";

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;

export function timeAgo(date: Date | string): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const seconds = Math.round((now - then) / 1000);

  if (seconds < MINUTE) return t("time.justNow");
  if (seconds < HOUR) return t("time.minutesAgo", { count: Math.floor(seconds / MINUTE) });
  if (seconds < DAY) return t("time.hoursAgo", { count: Math.floor(seconds / HOUR) });
  if (seconds < WEEK) return t("time.daysAgo", { count: Math.floor(seconds / DAY) });
  if (seconds < MONTH) return t("time.weeksAgo", { count: Math.floor(seconds / WEEK) });
  return t("time.monthsAgo", { count: Math.floor(seconds / MONTH) });
}
