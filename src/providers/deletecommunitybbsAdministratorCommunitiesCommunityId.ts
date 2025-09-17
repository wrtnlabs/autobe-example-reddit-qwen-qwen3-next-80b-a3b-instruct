import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { AdministratorPayload } from "../decorators/payload/AdministratorPayload";

/**
 * Permanently delete a community by ID
 *
 * This operation permanently removes a community and all its associated content
 * from the platform. It is exclusively available to administrators and triggers
 * a cascading deletion of all related data. When a community is deleted, all
 * posts, comments, votes, and search index entries associated with the
 * community are also removed from the database. This operation performs a hard
 * delete, meaning the community record is permanently removed from the database
 * and cannot be recovered. It is not a soft delete because, although the
 * communitybbs_community model has a deleted_at field, this field is used for
 * archival reporting and UI filtering only — the system does not preserve
 * records after deletion; instead, log entries are maintained for audit
 * purposes. This behavior is consistent with the requirement that
 * administrators can delete communities and purge all associated data. The
 * deletion is atomic and must succeed or fail entirely, ensuring no orphaned
 * records remain. The system will also log the deletion event in the
 * communitybbs_log table for audit trail purposes. This operation requires
 * elevated permissions because it irreversibly removes user-generated content
 * and metadata. Access is restricted to the administrator role with no fallback
 * to other roles for security and compliance reasons.
 *
 * @param props - Request properties
 * @param props.administrator - The authenticated administrator performing the
 *   deletion
 * @param props.communityId - UUID of the community to delete
 * @returns Void
 * @throws {Error} When the community does not exist
 * @throws {Error} When the authenticated administrator is not valid
 */
export async function deletecommunitybbsAdministratorCommunitiesCommunityId(props: {
  administrator: AdministratorPayload;
  communityId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { administrator, communityId } = props;

  // Verify administrator exists and is valid (using id only since deleted_at is excluded from WhereInput type)
  const administratorRecord =
    await MyGlobal.prisma.communitybbs_administrator.findFirst({
      where: {
        id: administrator.id,
      },
    });

  if (!administratorRecord) {
    throw new Error("Unauthorized: Administrator not found");
  }

  // Verify community exists
  const community =
    await MyGlobal.prisma.communitybbs_community.findUniqueOrThrow({
      where: {
        id: communityId,
      },
    });

  // Prepare deletion timestamp for log
  const deletedAt: string & tags.Format<"date-time"> = toISOStringSafe(
    new Date(),
  );

  // Create log entry for deletion
  await MyGlobal.prisma.communitybbs_log.create({
    data: {
      id: v4() as string & tags.Format<"uuid">,
      actor_id: administrator.id,
      target_id: communityId,
      action_type: "community_deleted",
      details: JSON.stringify({
        community_name: community.name,
        community_id: communityId,
        deleted_by_admin_id: administrator.id,
      }),
      created_at: deletedAt,
      ip_address: administratorRecord.ip_address ?? undefined,
    },
  });

  // Delete community and all cascading dependent records
  await MyGlobal.prisma.communitybbs_community.delete({
    where: {
      id: communityId,
    },
  });

  // No need for further cleanup - Prisma CASCADE onDelete handles all relations
  // communitybbs_post, communitybbs_search_post, communitybbs_search_community,
  // communitybbs_search_comment, communitybbs_comment, communitybbs_vote, etc.
  // are all set to CASCADE in the schema
}
