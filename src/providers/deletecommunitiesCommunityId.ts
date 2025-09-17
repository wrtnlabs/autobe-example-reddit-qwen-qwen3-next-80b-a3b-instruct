import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";

/**
 * Soft delete a community by ID
 *
 * This operation soft-deletes a community by setting the deleted_at field to
 * the current timestamp. The community is marked as archived and hidden from
 * public views. All dependent data (posts, comments, votes, and search indices)
 * are deleted cascadingly. The community record remains in the database for
 * audit purposes with its metadata preserved. This is a hard cascading deletion
 * of related content with soft archiving of the community entity, consistent
 * with the schema design.
 *
 * This operation is only accessible to administrators and is used for content
 * moderation and compliance. It is not a complete hard delete because the
 * community entity is preserved for audit trail, but all user-facing content is
 * permanently removed. The deletion triggers a cascade that removes all
 * communitybbs_post, communitybbs_search_post, communitybbs_search_comment, and
 * communitybbs_log entries linked to this community. A log entry is created in
 * communitybbs_log with action_type = 'community_deleted' to maintain
 * auditability. This operation cannot be undone and must be used with caution.
 * The community name is not made available for reuse to prevent impersonation.
 * Access is restricted to the administrator role with no fallback to other
 * roles for security and compliance reasons.
 *
 * @param props - Request properties
 * @param props.admin - The authenticated administrator performing the deletion
 * @param props.communityId - UUID of the community to delete
 * @returns Void
 * @throws {Error} When the community does not exist
 * @throws {Error} When the community is already deleted
 * @throws {Error} When unauthorized (non-admin user)
 */
export async function deletecommunitiesCommunityId(props: {
  admin: AdminPayload;
  communityId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { admin, communityId } = props;

  // Verify the community exists and is not already deleted
  const community =
    await MyGlobal.prisma.communitybbs_community.findUniqueOrThrow({
      where: { id: communityId },
    });

  // Prevent deletion if already deleted
  if (community.deleted_at !== null) {
    throw new Error("Cannot delete community: already archived");
  }

  // Update the community to mark it as deleted
  const now = toISOStringSafe(new Date());
  await MyGlobal.prisma.communitybbs_community.update({
    where: { id: communityId },
    data: { deleted_at: now },
  });

  // Create a log entry for the deletion
  await MyGlobal.prisma.communitybbs_log.create({
    data: {
      id: v4() as string & tags.Format<"uuid">,
      actor_id: admin.id,
      target_id: communityId,
      action_type: "community_deleted",
      created_at: now,
      ip_address: admin.ip_address ?? undefined,
    },
  });
}
