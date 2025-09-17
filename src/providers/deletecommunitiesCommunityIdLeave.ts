import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { MemberPayload } from "../decorators/payload/MemberPayload";

/**
 * Leave a community to stop receiving its posts in your home feed.
 *
 * This operation removes the authenticated member from a community’s membership
 * list. It decrements the member_count field in the communitybbs_community
 * table and updates the last_active_at field to reflect reduced activity. This
 * causes the member’s home feed to no longer include posts from this
 * community.
 *
 * The operation requires no additional data beyond community_id.
 *
 * @param props - Request properties
 * @param props.member - The authenticated member leaving the community
 * @param props.communityId - The unique identifier of the community to leave
 * @returns Void
 * @throws {Error} When the specified community does not exist
 * @throws {Error} When the specified community has been soft-deleted
 */
export async function deletecommunitiesCommunityIdLeave(props: {
  member: MemberPayload;
  communityId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { communityId } = props;

  const updatedCommunity = await MyGlobal.prisma.communitybbs_community.update({
    where: {
      id: communityId,
      deleted_at: null,
    },
    data: {
      member_count: {
        decrement: 1,
      },
      last_active_at: toISOStringSafe(new Date()),
    },
    select: {
      id: true,
    },
  });

  if (!updatedCommunity) {
    throw new Error("Community not found or already deleted");
  }
}
