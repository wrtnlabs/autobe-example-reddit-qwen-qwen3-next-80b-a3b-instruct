import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IResponseEmpty } from "@ORGANIZATION/PROJECT-api/lib/structures/IResponseEmpty";
import { AdministratorPayload } from "../decorators/payload/AdministratorPayload";

/**
 * Permanently delete a community and all its data (Admin only)
 *
 * This endpoint performs a hard delete of a community and all its associated
 * content, irreversibly purging data from the system. This includes:
 *
 * - The community record itself
 * - All posts in the community
 * - All comments on those posts
 * - All votes on posts and comments
 * - All search indexes related to the community and its content
 *
 * This operation is irreversible and cannot be undone. It is only accessible to
 * administrators with elevated privileges after multiple confirmation steps.
 *
 * When the community is deleted, all its related data is removed using Prisma's
 * cascade deletion configured on foreign key relations (ON DELETE CASCADE).
 * This ensures complete data purging without orphaned records.
 *
 * A log entry is created in the communitybbs_log table with the action type
 * 'community_permanently_deleted' and includes the administrator's ID and
 * timestamp.
 *
 * @param props - Request properties
 * @param props.administrator - The authenticated administrator performing the
 *   deletion
 * @param props.name - The name identifier of the community to permanently
 *   delete
 * @returns An empty response indicating successful deletion
 * @throws {Error} When the community with the specified name does not exist
 */
export async function deleteadminCommunitiesNamePermanentDelete(props: {
  administrator: AdministratorPayload;
  name: string;
}): Promise<IResponseEmpty> {
  const { administrator, name } = props;

  // Find the community by name - Prisma returns null if not found
  const community = await MyGlobal.prisma.communitybbs_community.findFirst({
    where: {
      name,
    },
  });

  // If community does not exist, throw error
  if (!community) {
    throw new Error(`Community with name '${name}' does not exist`);
  }

  // Delete the community - cascading delete will automatically remove:
  // - all related posts (communitybbs_post)
  // - all related comments (communitybbs_comment)
  // - all related votes (communitybbs_vote)
  // - all related search indexes (communitybbs_search_post, communitybbs_search_comment, communitybbs_search_community)
  await MyGlobal.prisma.communitybbs_community.delete({
    where: {
      id: community.id,
    },
  });

  // Create audit log entry
  await MyGlobal.prisma.communitybbs_log.create({
    data: {
      id: v4() as string & tags.Format<"uuid">,
      actor_id: administrator.id,
      target_id: community.id,
      action_type: "community_permanently_deleted",
      details: null,
      created_at: toISOStringSafe(new Date()),
      ip_address: null,
    },
  });

  // Return empty response as specified
  return {};
}
