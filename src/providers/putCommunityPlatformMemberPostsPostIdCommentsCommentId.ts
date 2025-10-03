import { HttpException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import typia, { tags } from "typia";
import { v4 } from "uuid";
import { MyGlobal } from "../MyGlobal";
import { PasswordUtil } from "../utils/PasswordUtil";
import { toISOStringSafe } from "../utils/toISOStringSafe";

import { ICommunityPlatformComment } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformComment";
import { MemberPayload } from "../decorators/payload/MemberPayload";

export async function putCommunityPlatformMemberPostsPostIdCommentsCommentId(props: {
  member: MemberPayload;
  postId: string & tags.Format<"uuid">;
  commentId: string & tags.Format<"uuid">;
  body: ICommunityPlatformComment.IUpdate;
}): Promise<ICommunityPlatformComment.ISparse> {
  // Fetch the comment to verify ownership and current state
  const comment = await MyGlobal.prisma.community_platform_comments.findFirst({
    where: {
      id: props.commentId,
      post_id: props.postId,
    },
    select: {
      id: true,
      post_id: true,
      author_id: true,
      parent_id: true,
      content: true,
      created_at: true,
      updated_at: true,
    },
  });

  // If comment doesn't exist, throw 404
  if (!comment) {
    throw new HttpException("Comment not found", 404);
  }

  // Verify ownership: only the original author can update
  if (comment.author_id !== props.member.id) {
    throw new HttpException("You can only edit comments you created", 403);
  }

  // Update the comment with new content and current timestamp
  const updated = await MyGlobal.prisma.community_platform_comments.update({
    where: {
      id: props.commentId,
    },
    data: {
      content: props.body.content,
      updated_at: toISOStringSafe(new Date()),
    },
    select: {
      id: true,
      post_id: true,
      author_id: true,
      parent_id: true,
      content: true,
      created_at: true,
      updated_at: true,
    },
  });

  // Return the formatted response with proper typing
  return {
    id: updated.id,
    post_id: updated.post_id,
    author_id: updated.author_id,
    parent_id: updated.parent_id,
    content: updated.content,
    created_at: toISOStringSafe(updated.created_at),
    updated_at: toISOStringSafe(updated.updated_at),
    score: 0,
  };
}
