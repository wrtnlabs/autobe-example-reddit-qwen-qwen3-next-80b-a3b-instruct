import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ICommunitybbsPost } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsPost";

export async function getcommunitybbsCommunitiesCommunityIdPostsPostId(props: {
  communityId: string & tags.Format<"uuid">;
  postId: string & tags.Format<"uuid">;
}): Promise<ICommunitybbsPost> {
  const { communityId, postId } = props;

  // Find the post and validate it belongs to the community
  const post = await MyGlobal.prisma.communitybbs_post.findUniqueOrThrow({
    where: {
      id: postId,
      deleted_at: null,
      communitybbs_community_id: communityId,
    },
    include: {
      community: true,
    },
  });

  // Count upvotes
  const upvotes = await MyGlobal.prisma.communitybbs_vote.count({
    where: {
      post_id: postId,
      type: "upvote",
    },
  });

  // Count downvotes
  const downvotes = await MyGlobal.prisma.communitybbs_vote.count({
    where: {
      post_id: postId,
      type: "downvote",
    },
  });

  // Compute score
  const score = upvotes - downvotes;

  // Return the post data with computed score, ensuring all dates use toISOStringSafe()
  return {
    id: post.id,
    communitybbs_community_id: post.communitybbs_community_id,
    communitybbs_member_id: post.communitybbs_member_id,
    title: post.title,
    body: post.body,
    display_name: post.display_name,
    created_at: toISOStringSafe(post.created_at),
    updated_at: post.updated_at ? toISOStringSafe(post.updated_at) : undefined,
    deleted_at: post.deleted_at ? toISOStringSafe(post.deleted_at) : undefined,
    score,
  } satisfies ICommunitybbsPost;
}
