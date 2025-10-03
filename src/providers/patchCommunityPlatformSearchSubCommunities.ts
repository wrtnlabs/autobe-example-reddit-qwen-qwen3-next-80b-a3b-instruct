import { HttpException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import typia, { tags } from "typia";
import { v4 } from "uuid";
import { MyGlobal } from "../MyGlobal";
import { PasswordUtil } from "../utils/PasswordUtil";
import { toISOStringSafe } from "../utils/toISOStringSafe";

import { ICommunityPlatformCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunity";
import { IPageICommunityPlatformCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageICommunityPlatformCommunity";
import { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";

export async function patchCommunityPlatformSearchSubCommunities(props: {
  body: ICommunityPlatformCommunity.IRequest;
}): Promise<IPageICommunityPlatformCommunity> {
  const { search, category, sort } = props.body;

  // Set defaults
  const page = props.body.page ?? 1;
  const limit = props.body.limit ?? 20;

  // Build where clause directly inline
  const where = {
    ...(search !== undefined && {
      OR: [
        { name: { contains: search } },
        { description: { contains: search } },
      ],
    }),
    ...(category !== undefined && { category }),
  };

  // Build orderBy clause directly inline
  const orderBy =
    sort === "recentlyCreated"
      ? { created_at: "desc" as const }
      : { name: "asc" as const };

  // Query materialized view
  const [results, total] = await Promise.all([
    MyGlobal.prisma.community_platform_search_communities.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    MyGlobal.prisma.community_platform_search_communities.count({ where }),
  ]);

  // Convert result to ICommunityPlatformCommunity
  const mappedResults: ICommunityPlatformCommunity[] = results.map((item) => ({
    id: item.community_id,
    name: item.name,
    category: item.category as ICommunityPlatformCommunity["category"],
    description:
      item.description !== null
        ? (item.description satisfies string as string)
        : undefined,
    rules: undefined,
    logo_url: undefined,
    banner_url: undefined,
    member_count: item.member_count,
    created_at: toISOStringSafe(item.created_at),
  }));

  // Calculate pagination
  const pages = Math.ceil(total / limit);

  return {
    pagination: {
      current: page,
      limit,
      records: total,
      pages,
    },
    data: mappedResults,
  };
}
