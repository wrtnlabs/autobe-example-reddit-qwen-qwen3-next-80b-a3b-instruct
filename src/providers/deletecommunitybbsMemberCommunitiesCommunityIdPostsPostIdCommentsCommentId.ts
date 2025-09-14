import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";

export async function deletecommunitybbsMemberCommunitiesCommunityIdPostsPostIdCommentsCommentId(props: {
  communityId: string & tags.Format<"uuid">;
  postId: string & tags.Format<"uuid">;
  commentId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { communityId, postId, commentId } = props;

  // Verify comment exists and belongs to the specified post
  const comment = await MyGlobal.prisma.communitybbs_comment.findUniqueOrThrow({
    where: {
      id: commentId,
    },
  });

  if (comment.communitybbs_post_id !== postId) {
    throw new Error("Comment does not belong to the specified post");
  }

  // Verify post belongs to the specified community
  const post = await MyGlobal.prisma.communitybbs_post.findUniqueOrThrow({
    where: {
      id: postId,
    },
  });

  if (post.communitybbs_community_id !== communityId) {
    throw new Error("Post does not belong to the specified community");
  }

  // Perform hard delete (no deleted_at field in schema)
  await MyGlobal.prisma.communitybbs_comment.delete({
    where: {
      id: commentId,
    },
  });

  // Log the deletion
  await MyGlobal.prisma.communitybbs_log.create({
    data: {
      actor_id: null,
      target_id: commentId,
      action_type: "comment_deleted",
      details: JSON.stringify({
        comment_id: commentId,
        post_id: postId,
        community_id: communityId,
      }),
      ip_address: null,
      created_at: toISOStringSafe(new Date()),
    },
  });
}
