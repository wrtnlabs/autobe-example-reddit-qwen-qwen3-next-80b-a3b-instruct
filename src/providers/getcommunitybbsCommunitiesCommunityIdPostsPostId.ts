import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ICommunitybbsPost } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsPost";

/**
 * Retrieve the full details of a specific post
 *
 * This operation returns the complete post object with all its fields: title,
 * body, author display name (as captured at time of creation), creation
 * timestamp, update timestamp. The system verifies that the target post belongs
 * to the specified community and that the post has not been soft-deleted
 * (deleted_at is null). This operation does not return associated comments —
 * those are available via a separate endpoint at
 * /communities/{communityId}/posts/{postId}/comments. This endpoint is designed
 * to support public viewability; any user — guest or authenticated — may access
 * a post detail page.
 *
 * @param props - Request properties
 * @param props.communityId - Unique identifier of the community containing the
 *   post
 * @param props.postId - Unique identifier of the post to retrieve
 * @returns Full details of the post, including title, body, author, community,
 *   creation time, and vote score
 * @throws {Error} When post doesn't exist, belongs to different community, or
 *   is soft-deleted
 */
export async function getcommunitybbsCommunitiesCommunityIdPostsPostId(props: {
  communityId: string & tags.Format<"uuid">;
  postId: string & tags.Format<"uuid">;
}): Promise<ICommunitybbsPost> {
  const { communityId, postId } = props;

  const post = await MyGlobal.prisma.communitybbs_post.findFirstOrThrow({
    where: {
      id: postId,
      communitybbs_community_id: communityId,
      deleted_at: null,
    },
  });

  return {
    id: post.id,
    communitybbs_community_id: post.communitybbs_community_id,
    communitybbs_member_id: post.communitybbs_member_id,
    title: post.title,
    body: post.body,
    display_name: post.display_name ?? undefined,
    created_at: toISOStringSafe(post.created_at),
    updated_at: post.updated_at ? toISOStringSafe(post.updated_at) : undefined,
    deleted_at: post.deleted_at ? toISOStringSafe(post.deleted_at) : undefined,
  };
}
