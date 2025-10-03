import { HttpException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import typia, { tags } from "typia";
import { v4 } from "uuid";
import { MyGlobal } from "../MyGlobal";
import { PasswordUtil } from "../utils/PasswordUtil";
import { toISOStringSafe } from "../utils/toISOStringSafe";

import { ICommunityPlatformCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunity";
import { IPageICommunityPlatformCommunitySummary } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageICommunityPlatformCommunitySummary";
import { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import { ICommunityPlatformCommunitySummary } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunitySummary";

export async function patchCommunityPlatformCommunities(props: {
  body: ICommunityPlatformCommunity.IRequest;
}): Promise<IPageICommunityPlatformCommunitySummary> {
  const { search, category, sort, page = 1, limit = 20 } = props.body;

  // Build WHERE clause
  const where: Record<string, unknown> = {};

  // Add search condition: match against name or description
  if (search !== undefined && search !== null) {
    where.OR = [
      { name: { contains: search } },
      { description: { contains: search } },
    ];
  }

  // Add category filter
  if (category !== undefined && category !== null) {
    where.category = category;
  }

  // Build ORDER BY clause
  const orderBy: Record<string, string> = {};
  if (sort === "recentlyCreated") {
    orderBy.created_at = "desc";
  } else {
    // Default to 'nameMatch' - sort by name ascending (alphabetical)
    orderBy.name = "asc";
  }

  // Calculate pagination offset
  const skip = (page - 1) * limit;

  // Query search_communities directly for optimized search performance
  const [communities, total] = await Promise.all([
    MyGlobal.prisma.community_platform_search_communities.findMany({
      where,
      orderBy,
      skip,
      take: limit,
    }),
    MyGlobal.prisma.community_platform_search_communities.count({ where }),
  ]);

  // Transform to response format
  const data: ICommunityPlatformCommunitySummary[] = communities.map(
    (comm) => ({
      id: comm.community_id,
      name: comm.name,
      category: comm.category,
      description: (comm.description ?? undefined) satisfies
        | string
        | undefined as string | undefined,
      member_count: comm.member_count,
      created_at: toISOStringSafe(comm.created_at),
    }),
  );

  // Return paginated response
  return {
    pagination: {
      current: page,
      limit,
      records: total,
      pages: Math.ceil(total / limit),
    },
    data,
  };
}
