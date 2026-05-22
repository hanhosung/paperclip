import type { Agent } from "@paperclipai/shared";
import type { CompanyUserProfile } from "./company-members";
import { t } from "@/i18n";

type ActivityDetails = Record<string, unknown> | null | undefined;

type ActivityParticipant = {
  type: "agent" | "user";
  agentId?: string | null;
  userId?: string | null;
};

type ActivityIssueReference = {
  id?: string | null;
  identifier?: string | null;
  title?: string | null;
};

interface ActivityFormatOptions {
  agentMap?: Map<string, Agent>;
  userProfileMap?: Map<string, CompanyUserProfile>;
  currentUserId?: string | null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

/** Localize a status/priority enum value, falling back to a humanized form. */
function enumValueLabel(kind: "status" | "priority", value: unknown): string {
  if (typeof value !== "string") return String(value ?? "none");
  return t(`${kind}.${value}`, { defaultValue: value.replace(/_/g, " ") });
}

function isActivityParticipant(value: unknown): value is ActivityParticipant {
  const record = asRecord(value);
  if (!record) return false;
  return record.type === "agent" || record.type === "user";
}

function isActivityIssueReference(value: unknown): value is ActivityIssueReference {
  return asRecord(value) !== null;
}

function readParticipants(details: ActivityDetails, key: string): ActivityParticipant[] {
  const value = details?.[key];
  if (!Array.isArray(value)) return [];
  return value.filter(isActivityParticipant);
}

function readIssueReferences(details: ActivityDetails, key: string): ActivityIssueReference[] {
  const value = details?.[key];
  if (!Array.isArray(value)) return [];
  return value.filter(isActivityIssueReference);
}

function formatUserLabel(userId: string | null | undefined, options: ActivityFormatOptions = {}): string {
  if (!userId || userId === "local-board") return t("misc.activityRow.board");
  if (options.currentUserId && userId === options.currentUserId) return t("activity.actor.you");
  const profile = options.userProfileMap?.get(userId);
  if (profile) return profile.label;
  return t("activity.actor.user", { id: userId.slice(0, 5) });
}

function formatParticipantLabel(participant: ActivityParticipant, options: ActivityFormatOptions): string {
  if (participant.type === "agent") {
    const agentId = participant.agentId ?? "";
    return options.agentMap?.get(agentId)?.name ?? t("activity.actor.agent");
  }
  return formatUserLabel(participant.userId, options);
}

function formatIssueReferenceLabel(reference: ActivityIssueReference): string {
  if (reference.identifier) return reference.identifier;
  if (reference.title) return reference.title;
  if (reference.id) return reference.id.slice(0, 8);
  return t("activity.actor.issue");
}

function formatChangedEntityLabel(
  singular: string,
  plural: string,
  labels: string[],
): string {
  if (labels.length <= 0) return plural;
  if (labels.length === 1) return t("activity.entity.changedSingle", { singular, label: labels[0] });
  return t("activity.entity.changedMultiple", { count: labels.length, plural });
}

function formatIssueUpdatedVerb(details: ActivityDetails): string | null {
  if (!details) return null;
  const previous = asRecord(details._previous) ?? {};
  if (details.status !== undefined) {
    const from = previous.status;
    return from
      ? t("activity.verbDynamic.statusFromTo", {
          from: enumValueLabel("status", from),
          to: enumValueLabel("status", details.status),
        })
      : t("activity.verbDynamic.statusTo", { to: enumValueLabel("status", details.status) });
  }
  if (details.priority !== undefined) {
    const from = previous.priority;
    return from
      ? t("activity.verbDynamic.priorityFromTo", {
          from: enumValueLabel("priority", from),
          to: enumValueLabel("priority", details.priority),
        })
      : t("activity.verbDynamic.priorityTo", { to: enumValueLabel("priority", details.priority) });
  }
  return null;
}

function formatAssigneeName(details: ActivityDetails, options: ActivityFormatOptions): string | null {
  if (!details) return null;
  const agentId = details.assigneeAgentId;
  const userId = details.assigneeUserId;
  if (typeof agentId === "string" && agentId) {
    return options.agentMap?.get(agentId)?.name ?? t("activity.actor.agent");
  }
  if (typeof userId === "string" && userId) {
    return formatUserLabel(userId, options);
  }
  return null;
}

function formatIssueUpdatedAction(details: ActivityDetails, options: ActivityFormatOptions = {}): string | null {
  if (!details) return null;
  const previous = asRecord(details._previous) ?? {};
  const parts: string[] = [];

  if (details.status !== undefined) {
    const from = previous.status;
    parts.push(
      from
        ? t("activity.issueActionDynamic.statusFromTo", {
            from: enumValueLabel("status", from),
            to: enumValueLabel("status", details.status),
          })
        : t("activity.issueActionDynamic.statusTo", { to: enumValueLabel("status", details.status) }),
    );
  }
  if (details.priority !== undefined) {
    const from = previous.priority;
    parts.push(
      from
        ? t("activity.issueActionDynamic.priorityFromTo", {
            from: enumValueLabel("priority", from),
            to: enumValueLabel("priority", details.priority),
          })
        : t("activity.issueActionDynamic.priorityTo", { to: enumValueLabel("priority", details.priority) }),
    );
  }
  if (details.assigneeAgentId !== undefined || details.assigneeUserId !== undefined) {
    const assigneeName = formatAssigneeName(details, options);
    parts.push(
      assigneeName
        ? t("activity.issueActionDynamic.assignedTo", { name: assigneeName })
        : t("activity.issueActionDynamic.unassigned"),
    );
  }
  if (details.title !== undefined) parts.push(t("activity.issueActionDynamic.updatedTitle"));
  if (details.description !== undefined) parts.push(t("activity.issueActionDynamic.updatedDescription"));

  return parts.length > 0 ? parts.join(", ") : null;
}

function formatStructuredIssueChange(input: {
  action: string;
  details: ActivityDetails;
  options: ActivityFormatOptions;
  forIssueDetail: boolean;
}): string | null {
  const details = input.details;
  if (!details) return null;

  if (input.action === "issue.blockers_updated") {
    const added = readIssueReferences(details, "addedBlockedByIssues").map(formatIssueReferenceLabel);
    const removed = readIssueReferences(details, "removedBlockedByIssues").map(formatIssueReferenceLabel);
    const singular = t("activity.entity.blockerSingular");
    const plural = t("activity.entity.blockerPlural");
    if (added.length > 0 && removed.length === 0) {
      const changed = formatChangedEntityLabel(singular, plural, added);
      return input.forIssueDetail
        ? t("activity.issueActionDynamic.added", { label: changed })
        : t("activity.verbDynamic.addedTo", { label: changed });
    }
    if (removed.length > 0 && added.length === 0) {
      const changed = formatChangedEntityLabel(singular, plural, removed);
      return input.forIssueDetail
        ? t("activity.issueActionDynamic.removed", { label: changed })
        : t("activity.verbDynamic.removedFrom", { label: changed });
    }
    return input.forIssueDetail
      ? t("activity.issueActionDynamic.updatedParticipants", { plural })
      : t("activity.verbDynamic.updatedParticipantsOn", { plural });
  }

  if (input.action === "issue.reviewers_updated" || input.action === "issue.approvers_updated") {
    const added = readParticipants(details, "addedParticipants").map((participant) => formatParticipantLabel(participant, input.options));
    const removed = readParticipants(details, "removedParticipants").map((participant) => formatParticipantLabel(participant, input.options));
    const isReviewer = input.action === "issue.reviewers_updated";
    const singular = t(isReviewer ? "activity.entity.reviewerSingular" : "activity.entity.approverSingular");
    const plural = t(isReviewer ? "activity.entity.reviewerPlural" : "activity.entity.approverPlural");
    if (added.length > 0 && removed.length === 0) {
      const changed = formatChangedEntityLabel(singular, plural, added);
      return input.forIssueDetail
        ? t("activity.issueActionDynamic.added", { label: changed })
        : t("activity.verbDynamic.addedTo", { label: changed });
    }
    if (removed.length > 0 && added.length === 0) {
      const changed = formatChangedEntityLabel(singular, plural, removed);
      return input.forIssueDetail
        ? t("activity.issueActionDynamic.removed", { label: changed })
        : t("activity.verbDynamic.removedFrom", { label: changed });
    }
    return input.forIssueDetail
      ? t("activity.issueActionDynamic.updatedParticipants", { plural })
      : t("activity.verbDynamic.updatedParticipantsOn", { plural });
  }

  return null;
}

export function formatActivityVerb(
  action: string,
  details?: Record<string, unknown> | null,
  options: ActivityFormatOptions = {},
): string {
  if (action === "issue.updated") {
    const issueUpdatedVerb = formatIssueUpdatedVerb(details);
    if (issueUpdatedVerb) return issueUpdatedVerb;
  }

  const structuredChange = formatStructuredIssueChange({
    action,
    details,
    options,
    forIssueDetail: false,
  });
  if (structuredChange) return structuredChange;

  return t(`activity.verb.${action}`, { defaultValue: action.replace(/[._]/g, " ") });
}

export function formatIssueActivityAction(
  action: string,
  details?: Record<string, unknown> | null,
  options: ActivityFormatOptions = {},
): string {
  if (action === "issue.updated") {
    const issueUpdatedAction = formatIssueUpdatedAction(details, options);
    if (issueUpdatedAction) return issueUpdatedAction;
  }

  const structuredChange = formatStructuredIssueChange({
    action,
    details,
    options,
    forIssueDetail: true,
  });
  if (structuredChange) return structuredChange;

  if (action.startsWith("issue.monitor_") && details) {
    const serviceName = typeof details.serviceName === "string" && details.serviceName.trim()
      ? details.serviceName.trim()
      : null;
    const base = t(`activity.issueAction.${action}`, { defaultValue: action.replace(/[._]/g, " ") });
    return serviceName ? t("activity.issueActionDynamic.monitorForService", { base, service: serviceName }) : base;
  }

  if (
    (
      action === "issue.document_created" ||
      action === "issue.document_updated" ||
      action === "issue.document_locked" ||
      action === "issue.document_unlocked" ||
      action === "issue.document_deleted"
    ) &&
    details
  ) {
    const key = typeof details.key === "string" ? details.key : t("activity.actor.document");
    const base = t(`activity.issueAction.${action}`, { defaultValue: action.replace(/[._]/g, " ") });
    const title = typeof details.title === "string" && details.title ? details.title : null;
    return title
      ? t("activity.issueActionDynamic.documentWithKeyTitle", { base, key, title })
      : t("activity.issueActionDynamic.documentWithKey", { base, key });
  }

  return t(`activity.issueAction.${action}`, { defaultValue: action.replace(/[._]/g, " ") });
}
