import { Trans } from "react-i18next";
import { useTranslation } from "@/i18n";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ShortcutEntry {
  keys: string[];
  labelKey: string;
}

interface ShortcutSection {
  titleKey: string;
  shortcuts: ShortcutEntry[];
}

const sections: ShortcutSection[] = [
  {
    titleKey: "components.shortcuts.sectionInbox",
    shortcuts: [
      { keys: ["j"], labelKey: "components.shortcuts.moveDown" },
      { keys: ["↓"], labelKey: "components.shortcuts.moveDown" },
      { keys: ["k"], labelKey: "components.shortcuts.moveUp" },
      { keys: ["↑"], labelKey: "components.shortcuts.moveUp" },
      { keys: ["←"], labelKey: "components.shortcuts.collapseGroup" },
      { keys: ["→"], labelKey: "components.shortcuts.expandGroup" },
      { keys: ["Enter"], labelKey: "components.shortcuts.openItem" },
      { keys: ["a"], labelKey: "components.shortcuts.archiveItem" },
      { keys: ["y"], labelKey: "components.shortcuts.archiveItem" },
      { keys: ["r"], labelKey: "components.shortcuts.markRead" },
      { keys: ["U"], labelKey: "components.shortcuts.markUnread" },
    ],
  },
  {
    titleKey: "components.shortcuts.sectionIssueDetail",
    shortcuts: [
      { keys: ["y"], labelKey: "components.shortcuts.quickArchive" },
      { keys: ["g", "i"], labelKey: "components.shortcuts.goToInbox" },
      { keys: ["g", "c"], labelKey: "components.shortcuts.focusComposer" },
    ],
  },
  {
    titleKey: "components.shortcuts.sectionGlobal",
    shortcuts: [
      { keys: ["/"], labelKey: "components.shortcuts.searchPage" },
      { keys: ["c"], labelKey: "components.shortcuts.newIssue" },
      { keys: ["["], labelKey: "components.shortcuts.toggleSidebar" },
      { keys: ["]"], labelKey: "components.shortcuts.togglePanel" },
      { keys: ["?"], labelKey: "components.shortcuts.showShortcuts" },
    ],
  },
];

function KeyCap({ children }: { children: string }) {
  return (
    <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded border border-border bg-muted px-1.5 font-mono text-xs font-medium text-foreground shadow-[0_1px_0_1px_hsl(var(--border))]">
      {children}
    </kbd>
  );
}

export function KeyboardShortcutsCheatsheetContent() {
  const { t } = useTranslation();
  return (
    <>
      <div className="divide-y divide-border border-t border-border">
        {sections.map((section) => (
          <div key={section.titleKey} className="px-5 py-3">
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t(section.titleKey)}
            </h3>
            <div className="space-y-1.5">
              {section.shortcuts.map((shortcut) => (
                <div
                  key={shortcut.labelKey + shortcut.keys.join()}
                  className="flex items-center justify-between gap-4"
                >
                  <span className="text-sm text-foreground/90">{t(shortcut.labelKey)}</span>
                  <div className="flex items-center gap-1">
                    {shortcut.keys.map((key, i) => (
                      <span key={key} className="flex items-center gap-1">
                        {i > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {t("components.shortcuts.then")}
                          </span>
                        )}
                        <KeyCap>{key}</KeyCap>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-border px-5 py-3">
        <p className="text-xs text-muted-foreground">
          <Trans i18nKey="components.shortcuts.footer" components={[<KeyCap key="esc">Esc</KeyCap>]} />
        </p>
      </div>
    </>
  );
}

export function KeyboardShortcutsCheatsheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md gap-0 p-0 overflow-hidden" showCloseButton={false}>
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="text-base">{t("components.shortcuts.title")}</DialogTitle>
        </DialogHeader>
        <KeyboardShortcutsCheatsheetContent />
      </DialogContent>
    </Dialog>
  );
}
