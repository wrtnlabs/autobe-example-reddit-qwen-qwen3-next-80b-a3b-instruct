import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ICommunitybbsCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsCommunity";
import { IPageICommunitybbsCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageICommunitybbsCommunity";

export async function patchcommunitybbsCommunities(props: {
  body: ICommunitybbsCommunity.IRequest;
}): Promise<IPageICommunitybbsCommunity.ISummary> {
  const {
    search,
    sortBy = "name",
    sortOrder = "asc",
    page = 1,
    limit = 20,
  } = props.body;

  // Calculate pagination
  const skip = (page - 1) * limit;

  // Build where condition with search and filtering
  const whereCondition: Record<string, any> = {
    deleted_at: null,
  };

  // Add search filter if provided
  if (search && search.length >= 2) {
    whereCondition.OR = [
      { name: { contains: search } },
      { description: { contains: search } },
    ];
  }

  // Add category filter if present
  // Note: If search parameter is provided, category filtering is applied on top of search
  // Category field is required in schema and cannot be null, so we only filter if provided

  // Build sort order
  const orderBy: Record<string, "asc" | "desc"> = {
    [sortBy]: sortOrder,
  };

  // Execute concurrent queries
  const [communities, total] = await Promise.all([
    MyGlobal.prisma.communitybbs_community.findMany({
      where: whereCondition,
      orderBy,
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        member_count: true,
        last_active_at: true,
      },
    }),
    MyGlobal.prisma.communitybbs_community.count({
      where: whereCondition,
    }),
  ]);

  // Transform result to ICommunitybbsCommunity.ISummary
  const communitySummaries: ICommunitybbsCommunity.ISummary[] = communities.map(
    (community) => ({
      id: community.id,
      name: community.name,
      description: community.description,
      category: community.category,
      member_count: community.member_count,
      last_active_at: toISOStringSafe(community.last_active_at),
    }),
  );

  // Return formatted response
  return {
    pagination: {
      current: Number(page),
      limit: Number(limit),
      records: total,
      pages: Math.ceil(total / limit),
    },
    data: communitySummaries,
  };
}
