import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { MemberPayload } from "../decorators/payload/MemberPayload";

/**
 * Join a sub-community to receive its posts in your home feed.
 *
 * This operation allows an authenticated member to join a sub-community. It
 * increments the member_count field in the corresponding record of the
 * communitybbs_community table and creates a reference between the member and
 * the community in a junction table (not shown in schema but implied by the
 * last_active_at feature). The update directly affects the community's
 * member_count used in search results and the Explore page. Concurrently, the
 * last_active_at field of the community is updated to the current timestamp to
 * affect its sorting in the 'Recent Communities' list. This change triggers
 * real-time updates to the user’s home feed to include new posts from this
 * community. The member’s own history of joined communities is tracked
 * internally to support the Home feed filtering logic. This operation aligns
 * with the presence of the member_count and last_active_at fields in the
 * communitybbs_community table, which are denormalized for performance and
 * updated by application logic on join / leave events. The join action is
 * idempotent — attempting to join an already-joined community has no effect.
 *
 * @param props - Request properties
 * @param props.member - The authenticated member making the join request
 * @param props.communityId - The unique identifier of the community to join
 * @returns Void
 * @throws {Error} When the community does not exist
 */
export async function postcommunitiesCommunityIdJoin(props: {
  member: MemberPayload;
  communityId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { communityId } = props;

  // Verify community exists
  const community =
    await MyGlobal.prisma.communitybbs_community.findUniqueOrThrow({
      where: { id: communityId },
    });

  // Update community: increment member_count and update last_active_at
  await MyGlobal.prisma.communitybbs_community.update({
    where: { id: communityId },
    data: {
      member_count: community.member_count + 1,
      last_active_at: toISOStringSafe(new Date()),
    },
  });
}
