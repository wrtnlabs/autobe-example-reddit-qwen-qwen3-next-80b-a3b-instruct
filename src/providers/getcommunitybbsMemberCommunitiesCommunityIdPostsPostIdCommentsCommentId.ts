import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ICommunitybbsComment } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsComment";

export async function getcommunitybbsMemberCommunitiesCommunityIdPostsPostIdCommentsCommentId(props: {
  communityId: string & tags.Format<"uuid">;
  postId: string & tags.Format<"uuid">;
  commentId: string & tags.Format<"uuid">;
}): Promise<ICommunitybbsComment> {
  const { communityId, postId, commentId } = props;

  // Fetch the comment with its relationships
  const comment = await MyGlobal.prisma.communitybbs_comment.findUnique({
    where: {
      id: commentId,
      communitybbs_post_id: postId,
    },
    include: {
      post: {
        select: {
          communitybbs_community_id: true,
        },
      },
    },
  });

  // Validate that the comment belongs to the specified community
  if (!comment) {
    throw new Error(
      "Comment not found or does not belong to the specified post",
    );
  }

  if (comment.post.communitybbs_community_id !== communityId) {
    throw new Error("Comment does not belong to the specified community");
  }

  // Return the comment with all required fields, ensuring date fields are properly formatted
  return {
    id: comment.id,
    communitybbs_post_id: comment.communitybbs_post_id,
    communitybbs_member_id: comment.communitybbs_member_id,
    communitybbs_comment_id: comment.communitybbs_comment_id,
    content: comment.content,
    display_name: comment.display_name,
    created_at: toISOStringSafe(comment.created_at),
    updated_at: comment.updated_at
      ? toISOStringSafe(comment.updated_at)
      : undefined,
    deleted_at: comment.deleted_at
      ? toISOStringSafe(comment.deleted_at)
      : undefined,
  };
}
