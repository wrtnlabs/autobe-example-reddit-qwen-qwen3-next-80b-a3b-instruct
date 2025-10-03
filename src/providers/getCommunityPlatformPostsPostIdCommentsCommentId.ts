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

export async function getCommunityPlatformPostsPostIdCommentsCommentId(props: {
  member: MemberPayload;
  postId: string & tags.Format<"uuid">;
  commentId: string & tags.Format<"uuid">;
}): Promise<ICommunityPlatformComment.ISparse> {
  const { commentId, postId } = props;

  const comment =
    await MyGlobal.prisma.community_platform_comments.findUniqueOrThrow({
      where: {
        id: commentId,
        post_id: postId,
        deleted_at: null,
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

  const [author, commentStats, replyCount] = await Promise.all([
    MyGlobal.prisma.community_platform_member.findUnique({
      where: { id: comment.author_id },
      select: { display_name: true },
    }),
    MyGlobal.prisma.community_platform_comment_stats.findUniqueOrThrow({
      where: { community_platform_comment_id: commentId },
      select: { score: true },
    }),
    MyGlobal.prisma.community_platform_comments.count({
      where: {
        parent_id: commentId,
        deleted_at: null,
      },
    }),
  ]);

  return {
    id: comment.id,
    post_id: comment.post_id,
    author_id: comment.author_id,
    parent_id: comment.parent_id,
    content: comment.content,
    created_at: toISOStringSafe(comment.created_at),
    updated_at: comment.updated_at ? toISOStringSafe(comment.updated_at) : null,
    author_display_name: author?.display_name ?? null,
    score: commentStats.score,
    reply_count: replyCount,
  };
}
