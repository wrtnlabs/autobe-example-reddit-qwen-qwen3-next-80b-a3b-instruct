import { HttpException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import typia, { tags } from "typia";
import { v4 } from "uuid";
import { MyGlobal } from "../MyGlobal";
import { PasswordUtil } from "../utils/PasswordUtil";
import { toISOStringSafe } from "../utils/toISOStringSafe";

import { ICommunityPlatformSearchComment } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformSearchComment";

export async function getCommunityPlatformSearchCommentsCommentId(props: {
  commentId: string & tags.Format<"uuid">;
}): Promise<ICommunityPlatformSearchComment> {
  const comment =
    await MyGlobal.prisma.community_platform_search_comments.findUniqueOrThrow({
      where: { id: props.commentId },
    });

  return {
    id: comment.id,
    comment_id: comment.comment_id,
    post_id: comment.post_id,
    community_id: comment.community_id,
    content: comment.content,
    author_name: comment.author_name,
    score: comment.score,
    created_at: toISOStringSafe(comment.created_at),
    updated_at: toISOStringSafe(comment.updated_at),
  };
}
