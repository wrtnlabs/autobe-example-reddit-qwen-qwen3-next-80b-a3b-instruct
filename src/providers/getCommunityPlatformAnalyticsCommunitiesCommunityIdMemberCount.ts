import { HttpException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import typia, { tags } from "typia";
import { v4 } from "uuid";
import { MyGlobal } from "../MyGlobal";
import { PasswordUtil } from "../utils/PasswordUtil";
import { toISOStringSafe } from "../utils/toISOStringSafe";

import { ICommunityPlatformCommunityStats } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunityStats";

export async function getCommunityPlatformAnalyticsCommunitiesCommunityIdMemberCount(props: {
  communityId: string & tags.Format<"uuid">;
}): Promise<ICommunityPlatformCommunityStats> {
  const stats =
    await MyGlobal.prisma.community_platform_community_stats.findUniqueOrThrow({
      where: {
        community_platform_community_id: props.communityId,
      },
    });

  return {
    member_count: stats.member_count,
  };
}
