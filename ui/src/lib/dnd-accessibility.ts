import type { Announcements, ScreenReaderInstructions } from "@dnd-kit/core";

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

/** Localized dnd-kit accessibility config. Pass `t` from `useTranslation()`. */
export function buildDndAccessibility(t: TranslateFn): {
  screenReaderInstructions: ScreenReaderInstructions;
  announcements: Announcements;
} {
  return {
    screenReaderInstructions: { draggable: t("a11y.dnd.instructions") },
    announcements: {
      onDragStart: ({ active }) => t("a11y.dnd.onDragStart", { id: active.id }),
      onDragOver: ({ active, over }) =>
        over
          ? t("a11y.dnd.onDragOver", { id: active.id, over: over.id })
          : t("a11y.dnd.onDragOverNoTarget", { id: active.id }),
      onDragEnd: ({ active, over }) =>
        over
          ? t("a11y.dnd.onDragEnd", { id: active.id, over: over.id })
          : t("a11y.dnd.onDragEndNoTarget", { id: active.id }),
      onDragCancel: ({ active }) => t("a11y.dnd.onDragCancel", { id: active.id }),
    },
  };
}
