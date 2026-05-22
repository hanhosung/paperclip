import { Link } from "@/lib/router";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { deriveInitials } from "./Identity";
import { IssueReferenceActivitySummary } from "./IssueReferenceActivitySummary";
import { timeAgo } from "../lib/timeAgo";
import { cn } from "../lib/utils";
import { useTranslation } from "@/i18n";
import { Trans } from "react-i18next";
import { formatActivityVerb } from "../lib/activity-format";
import { deriveProjectUrlKey, type ActivityEvent, type Agent } from "@paperclipai/shared";
import type { CompanyUserProfile } from "../lib/company-members";

function entityLink(entityType: string, entityId: string, name?: string | null): string | null {
  switch (entityType) {
    case "issue": return `/issues/${name ?? entityId}`;
    case "agent": return `/agents/${entityId}`;
    case "project": return `/projects/${deriveProjectUrlKey(name, entityId)}`;
    case "goal": return `/goals/${entityId}`;
    case "approval": return `/approvals/${entityId}`;
    default: return null;
  }
}

interface ActivityRowProps {
  event: ActivityEvent;
  agentMap: Map<string, Agent>;
  userProfileMap?: Map<string, CompanyUserProfile>;
  entityNameMap: Map<string, string>;
  entityTitleMap?: Map<string, string>;
  className?: string;
}

export function ActivityRow({ event, agentMap, userProfileMap, entityNameMap, entityTitleMap, className }: ActivityRowProps) {
  const { t } = useTranslation();
  const verb = formatActivityVerb(event.action, event.details, { agentMap, userProfileMap });

  const isHeartbeatEvent = event.entityType === "heartbeat_run";
  const heartbeatAgentId = isHeartbeatEvent
    ? (event.details as Record<string, unknown> | null)?.agentId as string | undefined
    : undefined;

  const name = isHeartbeatEvent
    ? (heartbeatAgentId ? entityNameMap.get(`agent:${heartbeatAgentId}`) : null)
    : entityNameMap.get(`${event.entityType}:${event.entityId}`);

  const entityTitle = entityTitleMap?.get(`${event.entityType}:${event.entityId}`);

  const link = isHeartbeatEvent && heartbeatAgentId
    ? `/agents/${heartbeatAgentId}/runs/${event.entityId}`
    : entityLink(event.entityType, event.entityId, name);

  const actor = event.actorType === "agent" ? agentMap.get(event.actorId) : null;
  const userProfile = event.actorType === "user" ? userProfileMap?.get(event.actorId) : null;
  const actorName = actor?.name ?? (event.actorType === "system" ? t("misc.activityRow.system") : userProfile?.label ?? (event.actorType === "user" ? t("misc.activityRow.board") : event.actorId || t("misc.activityRow.unknown")));
  const actorAvatarUrl = userProfile?.image ?? null;

  const lineKey = name
    ? (entityTitle ? "activity.line" : "activity.lineNoTitle")
    : "activity.lineNoName";

  const inner = (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Avatar size="xs">
            {actorAvatarUrl && <AvatarImage src={actorAvatarUrl} alt={actorName} />}
            <AvatarFallback>{deriveInitials(actorName)}</AvatarFallback>
          </Avatar>
          <p className="min-w-0 flex-1 truncate">
            <Trans
              t={t}
              i18nKey={lineKey}
              values={{ actor: actorName, verb, name: name ?? "", title: entityTitle ?? "" }}
              components={{
                v: <span className="text-muted-foreground" />,
                n: <span className="font-medium" />,
                s: <span className="text-muted-foreground" />,
              }}
            />
          </p>
        </div>
        <span className="text-xs text-muted-foreground shrink-0">{timeAgo(event.createdAt)}</span>
      </div>
      <IssueReferenceActivitySummary event={event} />
    </div>
  );

  const classes = cn(
    "px-4 py-2 text-sm",
    link && "cursor-pointer hover:bg-accent/50 transition-colors",
    className,
  );

  if (link) {
    return (
      <Link to={link} className={cn(classes, "no-underline text-inherit block")}>
        {inner}
      </Link>
    );
  }

  return (
    <div className={classes}>
      {inner}
    </div>
  );
}
