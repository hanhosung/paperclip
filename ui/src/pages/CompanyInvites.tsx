import { useEffect, useMemo, useState } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, ExternalLink, MailPlus } from "lucide-react";
import { accessApi } from "@/api/access";
import { ApiError } from "@/api/client";
import { Button } from "@/components/ui/button";
import { useBreadcrumbs } from "@/context/BreadcrumbContext";
import { useCompany } from "@/context/CompanyContext";
import { useToast } from "@/context/ToastContext";
import { useTranslation } from "@/i18n";
import { Link } from "@/lib/router";
import { queryKeys } from "@/lib/queryKeys";

/** Invite role options; label/description/gets hold i18n keys resolved at render. */
const inviteRoleOptions = [
  {
    value: "viewer",
    label: "companySettings.invitesPage.role.viewerLabel",
    description: "companySettings.invitesPage.role.viewerDescription",
    gets: "companySettings.invitesPage.role.viewerGets",
  },
  {
    value: "operator",
    label: "companySettings.invitesPage.role.operatorLabel",
    description: "companySettings.invitesPage.role.operatorDescription",
    gets: "companySettings.invitesPage.role.operatorGets",
  },
  {
    value: "admin",
    label: "companySettings.invitesPage.role.adminLabel",
    description: "companySettings.invitesPage.role.adminDescription",
    gets: "companySettings.invitesPage.role.adminGets",
  },
  {
    value: "owner",
    label: "companySettings.invitesPage.role.ownerLabel",
    description: "companySettings.invitesPage.role.ownerDescription",
    gets: "companySettings.invitesPage.role.ownerGets",
  },
] as const;

const INVITE_HISTORY_PAGE_SIZE = 5;

function isInviteHistoryRow(value: unknown): value is Awaited<ReturnType<typeof accessApi.listInvites>>["invites"][number] {
  if (!value || typeof value !== "object") return false;
  return "id" in value && "state" in value && "createdAt" in value;
}

export function CompanyInvites() {
  const { t } = useTranslation();
  const { selectedCompany, selectedCompanyId } = useCompany();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();
  const [humanRole, setHumanRole] = useState<"owner" | "admin" | "operator" | "viewer">("operator");
  const [latestInviteUrl, setLatestInviteUrl] = useState<string | null>(null);
  const [latestInviteCopied, setLatestInviteCopied] = useState(false);

  useEffect(() => {
    if (!latestInviteCopied) return;
    const timeout = window.setTimeout(() => {
      setLatestInviteCopied(false);
    }, 1600);
    return () => window.clearTimeout(timeout);
  }, [latestInviteCopied]);

  async function copyInviteUrl(url: string) {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        return true;
      }
    } catch {
      // Fall through to the unavailable message below.
    }

    pushToast({
      title: t("companySettings.invitesPage.toast.clipboardUnavailable"),
      body: t("companySettings.invitesPage.toast.clipboardUnavailableBody"),
      tone: "warn",
    });
    return false;
  }

  useEffect(() => {
    setBreadcrumbs([
      { label: selectedCompany?.name ?? t("companySettings.breadcrumbCompany"), href: "/dashboard" },
      { label: t("companySettings.breadcrumbSettings"), href: "/company/settings" },
      { label: t("companySettings.invitesPage.breadcrumb") },
    ]);
  }, [selectedCompany?.name, setBreadcrumbs, t]);

  const inviteHistoryQueryKey = queryKeys.access.invites(selectedCompanyId ?? "", "all", INVITE_HISTORY_PAGE_SIZE);
  const invitesQuery = useInfiniteQuery({
    queryKey: inviteHistoryQueryKey,
    queryFn: ({ pageParam }) =>
      accessApi.listInvites(selectedCompanyId!, {
        limit: INVITE_HISTORY_PAGE_SIZE,
        offset: pageParam,
      }),
    enabled: !!selectedCompanyId,
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
  });
  const inviteHistory = useMemo(
    () =>
      invitesQuery.data?.pages.flatMap((page) =>
        Array.isArray(page?.invites) ? page.invites.filter(isInviteHistoryRow) : [],
      ) ?? [],
    [invitesQuery.data?.pages],
  );

  const createInviteMutation = useMutation({
    mutationFn: () =>
      accessApi.createCompanyInvite(selectedCompanyId!, {
        allowedJoinTypes: "human",
        humanRole,
        agentMessage: null,
      }),
    onSuccess: async (invite) => {
      setLatestInviteUrl(invite.inviteUrl);
      setLatestInviteCopied(false);
      const copied = await copyInviteUrl(invite.inviteUrl);

      await queryClient.invalidateQueries({ queryKey: inviteHistoryQueryKey });
      pushToast({
        title: t("companySettings.invitesPage.toast.inviteCreated"),
        body: copied
          ? t("companySettings.invitesPage.toast.inviteCreatedCopied")
          : t("companySettings.invitesPage.toast.inviteCreatedBody"),
        tone: "success",
      });
    },
    onError: (error) => {
      pushToast({
        title: t("companySettings.invitesPage.toast.createFailed"),
        body: error instanceof Error ? error.message : t("companySettings.invitesPage.toast.unknownError"),
        tone: "error",
      });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (inviteId: string) => accessApi.revokeInvite(inviteId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: inviteHistoryQueryKey });
      pushToast({ title: t("companySettings.invitesPage.toast.inviteRevoked"), tone: "success" });
    },
    onError: (error) => {
      pushToast({
        title: t("companySettings.invitesPage.toast.revokeFailed"),
        body: error instanceof Error ? error.message : t("companySettings.invitesPage.toast.unknownError"),
        tone: "error",
      });
    },
  });

  if (!selectedCompanyId) {
    return <div className="text-sm text-muted-foreground">{t("companySettings.invitesPage.selectCompany")}</div>;
  }

  if (invitesQuery.isLoading) {
    return <div className="text-sm text-muted-foreground">{t("companySettings.invitesPage.loading")}</div>;
  }

  if (invitesQuery.error) {
    const message =
      invitesQuery.error instanceof ApiError && invitesQuery.error.status === 403
        ? t("companySettings.invitesPage.permissionDenied")
        : invitesQuery.error instanceof Error
          ? invitesQuery.error.message
          : t("companySettings.invitesPage.loadError");
    return <div className="text-sm text-destructive">{message}</div>;
  }

  return (
    <div className="max-w-5xl space-y-8">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <MailPlus className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-lg font-semibold">{t("companySettings.invitesPage.title")}</h1>
        </div>
        <p className="max-w-3xl text-sm text-muted-foreground">
          {t("companySettings.invitesPage.description")}
        </p>
      </div>

      <section className="space-y-4 rounded-xl border border-border p-5">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold">{t("companySettings.invitesPage.createInvite")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("companySettings.invitesPage.createInviteDescription")}
          </p>
        </div>

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">{t("companySettings.invitesPage.chooseRole")}</legend>
          <div className="rounded-xl border border-border">
            {inviteRoleOptions.map((option, index) => {
              const checked = humanRole === option.value;
              return (
                <label
                  key={option.value}
                  className={`flex cursor-pointer gap-3 px-4 py-4 ${index > 0 ? "border-t border-border" : ""}`}
                >
                  <input
                    type="radio"
                    name="invite-role"
                    value={option.value}
                    checked={checked}
                    onChange={() => setHumanRole(option.value)}
                    className="mt-1 h-4 w-4 border-border text-foreground"
                  />
                  <span className="min-w-0 space-y-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">{t(option.label)}</span>
                      {option.value === "operator" ? (
                        <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                          {t("companySettings.invitesPage.default")}
                        </span>
                      ) : null}
                    </span>
                    <span className="block max-w-2xl text-sm text-muted-foreground">{t(option.description)}</span>
                    <span className="block text-sm text-foreground">{t(option.gets)}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="rounded-lg border border-border px-4 py-3 text-sm text-muted-foreground">
          {t("companySettings.invitesPage.singleUseNote")}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => createInviteMutation.mutate()} disabled={createInviteMutation.isPending}>
            {createInviteMutation.isPending
              ? t("companySettings.invitesPage.creating")
              : t("companySettings.invitesPage.createInvite")}
          </Button>
          <span className="text-sm text-muted-foreground">{t("companySettings.invitesPage.historyHint")}</span>
        </div>

        {latestInviteUrl ? (
          <div className="space-y-3 rounded-lg border border-border px-4 py-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium">{t("companySettings.invitesPage.latestInviteLink")}</div>
                {latestInviteCopied ? (
                  <div className="inline-flex items-center gap-1 text-xs font-medium text-foreground">
                    <Check className="h-3.5 w-3.5" />
                    {t("companySettings.invitesPage.copied")}
                  </div>
                ) : null}
              </div>
              <div className="text-sm text-muted-foreground">
                {t("companySettings.invitesPage.latestInviteUrlNote")}
              </div>
            </div>
            <button
              type="button"
              onClick={async () => {
                const copied = await copyInviteUrl(latestInviteUrl);
                setLatestInviteCopied(copied);
              }}
              className="w-full rounded-md border border-border bg-muted/60 px-3 py-2 text-left text-sm break-all transition-colors hover:bg-background"
            >
              {latestInviteUrl}
            </button>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" asChild>
                <a href={latestInviteUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  {t("companySettings.invitesPage.openInvite")}
                </a>
              </Button>
            </div>
          </div>
        ) : null}
      </section>

      <section className="rounded-xl border border-border">
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold">{t("companySettings.invitesPage.inviteHistory")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("companySettings.invitesPage.inviteHistoryDescription")}
            </p>
          </div>
          <Link to="/inbox/requests" className="text-sm underline underline-offset-4">
            {t("companySettings.invitesPage.openJoinRequestQueue")}
          </Link>
        </div>

        {inviteHistory.length === 0 ? (
          <div className="border-t border-border px-5 py-8 text-sm text-muted-foreground">
            {t("companySettings.invitesPage.noInvites")}
          </div>
        ) : (
          <div className="border-t border-border">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-5 py-3 font-medium text-muted-foreground">{t("companySettings.invitesPage.colState")}</th>
                    <th className="px-5 py-3 font-medium text-muted-foreground">{t("companySettings.invitesPage.colRole")}</th>
                    <th className="px-5 py-3 font-medium text-muted-foreground">{t("companySettings.invitesPage.colInvitedBy")}</th>
                    <th className="px-5 py-3 font-medium text-muted-foreground">{t("companySettings.invitesPage.colCreated")}</th>
                    <th className="px-5 py-3 font-medium text-muted-foreground">{t("companySettings.invitesPage.colJoinRequest")}</th>
                    <th className="px-5 py-3 text-right font-medium text-muted-foreground">{t("companySettings.invitesPage.colAction")}</th>
                  </tr>
                </thead>
                <tbody>
                  {inviteHistory.map((invite) => (
                    <tr key={invite.id} className="border-b border-border last:border-b-0">
                      <td className="px-5 py-3 align-top">
                        <span className="inline-flex rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                          {t(`companySettings.invitesPage.state.${invite.state}`)}
                        </span>
                      </td>
                      <td className="px-5 py-3 align-top">{invite.humanRole ?? "—"}</td>
                      <td className="px-5 py-3 align-top">
                        <div>{invite.invitedByUser?.name || invite.invitedByUser?.email || t("companySettings.invitesPage.unknownInviter")}</div>
                        {invite.invitedByUser?.email && invite.invitedByUser.name ? (
                          <div className="text-xs text-muted-foreground">{invite.invitedByUser.email}</div>
                        ) : null}
                      </td>
                      <td className="px-5 py-3 align-top text-muted-foreground">
                        {new Date(invite.createdAt).toLocaleString()}
                      </td>
                      <td className="px-5 py-3 align-top">
                        {invite.relatedJoinRequestId ? (
                          <Link to="/inbox/requests" className="underline underline-offset-4">
                            {t("companySettings.invitesPage.reviewRequest")}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right align-top">
                        {invite.state === "active" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => revokeMutation.mutate(invite.id)}
                            disabled={revokeMutation.isPending}
                          >
                            {t("companySettings.invitesPage.revoke")}
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">{t("companySettings.invitesPage.inactive")}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {invitesQuery.hasNextPage ? (
              <div className="flex justify-center border-t border-border px-5 py-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => invitesQuery.fetchNextPage()}
                  disabled={invitesQuery.isFetchingNextPage}
                >
                  {invitesQuery.isFetchingNextPage
                    ? t("companySettings.invitesPage.loadingMore")
                    : t("companySettings.invitesPage.viewMore")}
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
