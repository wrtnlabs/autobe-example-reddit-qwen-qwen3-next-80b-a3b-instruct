import { HttpException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import typia, { tags } from "typia";
import { v4 } from "uuid";
import { MyGlobal } from "../MyGlobal";
import { PasswordUtil } from "../utils/PasswordUtil";
import { toISOStringSafe } from "../utils/toISOStringSafe";

import { ICommunityPlatformCommunityPlatformUserCommunityIRequest } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunityPlatformUserCommunityIRequest";
import { IPageICommunityPlatformCommunityPlatformUserCommunityISummary } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageICommunityPlatformCommunityPlatformUserCommunityISummary";
import { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import { ICommunityPlatformCommunityPlatformUserCommunityISummary } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunityPlatformUserCommunityISummary";

export async function patchCommunityPlatformCommunitiesCommunityNameMembers(props: {
  communityName: string;
  body: ICommunityPlatformCommunityPlatformUserCommunityIRequest;
}): Promise<IPageICommunityPlatformCommunityPlatformUserCommunityISummary> {
  const { communityName, body } = props;

  const { limit, offset, sort, direction, community_name: filterName } = body;

  // Build WHERE condition
  const whereCondition = {
    community: {
      name: communityName,
      ...(filterName && { name: { contains: filterName } }),
    },
  };

  // Build ORDER BY clause
  const orderByCondition = {
    [sort]: direction,
  };

  // Query to find the community members with their community info
  const [communityMembers, total] = await Promise.all([
    MyGlobal.prisma.community_platform_user_communities.findMany({
      where: whereCondition,
      orderBy: orderByCondition,
      skip: offset,
      take: limit,
      include: {
        community: {
          select: {
            name: true,
          },
        },
      },
    }),
    MyGlobal.prisma.community_platform_user_communities.count({
      where: whereCondition,
    }),
  ]);

  // Transform to summary format
  const summaryData: ICommunityPlatformCommunityPlatformUserCommunityISummary[] =
    communityMembers.map((member) => ({
      community_id: member.community_platform_community_id,
      community_name: member.community.name,
      last_interaction_at: toISOStringSafe(member.last_interaction_at),
      created_at: member.created_at
        ? toISOStringSafe(member.created_at)
        : undefined,
    }));

  // Calculate total pages
  const pages = total === 0 ? 1 : Math.ceil(total / limit);

  return {
    pagination: {
      current: offset === 0 ? 1 : offset / limit + 1,
      limit,
      records: total,
      pages,
    },
    data: summaryData,
  };
}
