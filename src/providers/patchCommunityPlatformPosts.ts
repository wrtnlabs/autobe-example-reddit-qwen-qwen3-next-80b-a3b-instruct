import { HttpException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import typia, { tags } from "typia";
import { v4 } from "uuid";
import { MyGlobal } from "../MyGlobal";
import { PasswordUtil } from "../utils/PasswordUtil";
import { toISOStringSafe } from "../utils/toISOStringSafe";

import { ICommunityPlatformCommunityPlatformPostIRequest } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunityPlatformPostIRequest";
import { IPageICommunityPlatformCommunityPlatformPostISummary } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageICommunityPlatformCommunityPlatformPostISummary";
import { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import { ICommunityPlatformCommunityPlatformPostISummary } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunityPlatformPostISummary";

export async function patchCommunityPlatformPosts(props: {
  body: ICommunityPlatformCommunityPlatformPostIRequest;
}): Promise<IPageICommunityPlatformCommunityPlatformPostISummary> {
  const { body } = props;

  // Validate query length as per schema requirement
  if (body.query.length < 2) {
    throw new HttpException(
      "Bad Request: Query must be at least 2 characters",
      400,
    );
  }

  // Build where conditions
  const where = {
    // Single post_id search bypasses all other filters
    ...(body.post_id !== undefined &&
      body.post_id !== null && { id: body.post_id }),
    // Text search (title or body) - uses pg_trgm index from schema
    ...((body.post_id === undefined || body.post_id === null) &&
      body.query.length > 0 && {
        OR: [
          { title: { contains: body.query } },
          { body: { contains: body.query } },
        ],
      }),
    // Community filter
    ...(body.community_id !== undefined &&
      body.community_id !== null && { community_id: body.community_id }),
    // Author name filter
    ...(body.author_name !== undefined &&
      body.author_name !== null && {
        author_name: { contains: body.author_name },
      }),
    // Date range filters
    ...(((body.created_after !== undefined && body.created_after !== null) ||
      (body.created_before !== undefined && body.created_before !== null)) && {
      created_at: {
        ...(body.created_after !== undefined &&
          body.created_after !== null && { gte: body.created_after }),
        ...(body.created_before !== undefined &&
          body.created_before !== null && { lte: body.created_before }),
      },
    }),
    // Score filters
    ...(((body.min_score !== undefined && body.min_score !== null) ||
      (body.max_score !== undefined && body.max_score !== null)) && {
      score: {
        ...(body.min_score !== undefined &&
          body.min_score !== null && { gte: body.min_score }),
        ...(body.max_score !== undefined &&
          body.max_score !== null && { lte: body.max_score }),
      },
    }),
  };

  // Build orderBy condition
  const orderBy =
    body.sort === "newest"
      ? { created_at: "desc" as const, id: "desc" as const }
      : {
          score: "desc" as const,
          created_at: "desc" as const,
          id: "desc" as const,
        };

  // Calculate pagination
  const skip = (body.page - 1) * body.limit;
  const take = body.limit;

  // Execute search and count
  const [posts, total] = await Promise.all([
    MyGlobal.prisma.community_platform_search_posts.findMany({
      where,
      orderBy,
      skip,
      take,
    }),
    MyGlobal.prisma.community_platform_search_posts.count({ where }),
  ]);

  // Extract unique community_ids from posts
  const communityIds = [...new Set(posts.map((post) => post.community_id))];

  // If there are community_ids, fetch community names
  const communityMap: Record<string, string> = {};
  if (communityIds.length > 0) {
    const communities =
      await MyGlobal.prisma.community_platform_communities.findMany({
        where: { id: { in: communityIds } },
        select: { id: true, name: true },
      });
    communities.forEach((community) => {
      communityMap[community.id] = community.name;
    });
  }

  // Transform posts to include community_name
  const postsWithCommunityName: ICommunityPlatformCommunityPlatformPostISummary[] =
    posts.map((post) => ({
      ...post,
      community_name: communityMap[post.community_id] || "",
      created_at: toISOStringSafe(post.created_at),
      updated_at: toISOStringSafe(post.updated_at),
    }));

  // Build response with proper pagination types
  return {
    pagination: {
      current: Number(body.page),
      limit: Number(body.limit),
      records: Number(total),
      pages: Number(Math.ceil(total / body.limit)),
    },
    data: postsWithCommunityName,
  };
}
