import { HttpException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import typia, { tags } from "typia";
import { v4 } from "uuid";
import { MyGlobal } from "../MyGlobal";
import { PasswordUtil } from "../utils/PasswordUtil";
import { toISOStringSafe } from "../utils/toISOStringSafe";

import { ICommunityPlatformPostScore } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformPostScore";

export async function getCommunityPlatformAnalyticsPostsPostIdScore(props: {
  postId: string & tags.Format<"uuid">;
}): Promise<ICommunityPlatformPostScore> {
  const postStats =
    await MyGlobal.prisma.community_platform_post_stats.findUniqueOrThrow({
      where: {
        community_platform_post_id: props.postId,
      },
    });

  return {
    score: postStats.score,
  };
}
