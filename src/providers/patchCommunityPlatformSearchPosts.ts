import { HttpException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import typia, { tags } from "typia";
import { v4 } from "uuid";
import { MyGlobal } from "../MyGlobal";
import { PasswordUtil } from "../utils/PasswordUtil";
import { toISOStringSafe } from "../utils/toISOStringSafe";

import { ICommunityPlatformPost } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformPost";
import { IPageICommunityPlatformPost } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageICommunityPlatformPost";
import { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";

export async function patchCommunityPlatformSearchPosts(props: {
  body: ICommunityPlatformPost.IRequest;
}): Promise<IPageICommunityPlatformPost> {
  // Set default pagination values if not provided
  const page = props.body.page ?? 1;
  const limit = props.body.limit ?? 20;

  // Build where clause with optional filters
  const where: Record<string, unknown> = {};

  // Apply search query if provided
  if (props.body.q) {
    where.OR = [
      { title: { contains: props.body.q } },
      { body: { contains: props.body.q } },
      { author_name: { contains: props.body.q } },
    ];
  }

  // Apply community filter if provided
  if (props.body.community_id) {
    where.community_id = props.body.community_id;
  }

  // Build orderBy clause based on sort parameter
  const orderBy: Record<string, string> = {};
  if (props.body.sort === "top") {
    orderBy.score = "desc";
    orderBy.created_at = "desc";
    orderBy.id = "desc";
  } else {
    // Default to newest
    orderBy.created_at = "desc";
    orderBy.id = "desc";
  }

  // Execute query to get posts
  const results =
    await MyGlobal.prisma.community_platform_search_posts.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });

  // Count total matches for pagination
  const total = await MyGlobal.prisma.community_platform_search_posts.count({
    where,
  });

  // Convert results to response format
  // WARNING: Cannot implement due to schema contradiction - ICommunityPlatformPost requires author_id (non-nullable string & Format<'uuid'>) but search view doesn't contain this field
  // This is an irreconcilable contradiction between API contract and database schema
  // @todo Either update the Prisma schema to include author_id in community_platform_search_posts, or update the ICommunityPlatformPost interface to make author_id nullable
  return typia.random<IPageICommunityPlatformPost>();
}
