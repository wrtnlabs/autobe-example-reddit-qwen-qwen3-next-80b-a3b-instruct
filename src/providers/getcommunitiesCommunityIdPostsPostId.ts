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

  // Fetch the post - ensure it belongs to the correct community and is not deleted
  const post = await MyGlobal.prisma.communitybbs_post.findFirst({
    where: {
      id: postId,
      communitybbs_community_id: communityId,
      deleted_at: null,
    },
  });

  if (!post) {
    throw new Error("Post not found");
  }

  // Count active comments for this post
  const commentCount = await MyGlobal.prisma.communitybbs_comment.count({
    where: {
      communitybbs_post_id: postId,
      deleted_at: null,
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

  // Calculate score
  const score = upvotes - downvotes;

  // Convert null display_name to undefined to match optional field in ICommunitybbsPost.ISummary
  const displayName =
    post.display_name === null ? undefined : post.display_name;

  // Format all date fields correctly using toISOStringSafe
  const createdAt = toISOStringSafe(post.created_at);

  // Return the summary object
  return {
    id: post.id,
    communitybbs_community_id: post.communitybbs_community_id,
    title: post.title,
    display_name: displayName,
    created_at: createdAt,
    comment_count: commentCount,
    score: score,
  };
}
