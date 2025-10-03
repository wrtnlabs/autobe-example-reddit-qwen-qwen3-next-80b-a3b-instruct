import { HttpException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import typia, { tags } from "typia";
import { v4 } from "uuid";
import { MyGlobal } from "../MyGlobal";
import { PasswordUtil } from "../utils/PasswordUtil";
import { toISOStringSafe } from "../utils/toISOStringSafe";

import { ICommunityPlatformCommentScore } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommentScore";

export async function getCommunityPlatformAnalyticsCommentsCommentIdScore(props: {
  commentId: string & tags.Format<"uuid">;
}): Promise<ICommunityPlatformCommentScore> {
  const scoreRecord =
    await MyGlobal.prisma.community_platform_comment_stats.findUnique({
      where: {
        community_platform_comment_id: props.commentId,
      },
    });

  if (!scoreRecord) {
    return { score: 0 };
  }

  return {
    score: scoreRecord.score,
  };
}
