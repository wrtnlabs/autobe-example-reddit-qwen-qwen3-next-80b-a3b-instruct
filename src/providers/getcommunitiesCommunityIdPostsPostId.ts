import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ICommunitybbsPost } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsPost";

export async function getcommunitiesCommunityIdPostsPostId(props: {
  communityId: string & tags.Format<"uuid">;
  postId: string & tags.Format<"uuid">;
}): Promise<ICommunitybbsPost.ISummary> {
  const { communityId, postId } = props;

  const result = await MyGlobal.prisma.communitybbs_post.findFirst({
    where: {
      id: postId,
      communitybbs_community_id: communityId,
      deleted_at: null,
    },
    select: {
      id: true,
      communitybbs_community_id: true,
      title: true,
      display_name: true,
      created_at: true,
    },
  });

  if (!result) {
    throw new Error("Post not found or inaccessible");
  }

  // Compute comment count from non-deleted comments
  const commentCountResult = await MyGlobal.prisma.communitybbs_comment.count({
    where: {
      communitybbs_post_id: postId,
      deleted_at: null,
    },
  });

  // Compute score: sum of upvotes minus downvotes
  const voteResult = await MyGlobal.prisma.communitybbs_vote.groupBy({
    by: ["post_id"],
    where: {
      post_id: postId,
      comment_id: null, // Only count votes directly on the post, not on comments
    },
    _sum: {
      type: true,
    },
  });

  // Calculate score: upvote = 1, downvote = -1; if no votes, score = 0
  let score = 0;
  if (voteResult.length > 0) {
    const total = voteResult[0]._sum.type;
    if (total !== null) {
      score = total as number;
    }
  }

  return {
    id: result.id,
    communitybbs_community_id: result.communitybbs_community_id,
    title: result.title,
    display_name: result.display_name,
    created_at: toISOStringSafe(result.created_at),
    comment_count: commentCountResult,
    score: score,
  };
}
