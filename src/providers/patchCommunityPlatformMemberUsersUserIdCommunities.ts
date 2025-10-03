import { HttpException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import typia, { tags } from "typia";
import { v4 } from "uuid";
import { MyGlobal } from "../MyGlobal";
import { PasswordUtil } from "../utils/PasswordUtil";
import { toISOStringSafe } from "../utils/toISOStringSafe";

import { ICommunityPlatformUserCommunityRequest } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformUserCommunityRequest";
import { IPageICommunityPlatformUserCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageICommunityPlatformUserCommunity";
import { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import { ICommunityPlatformUserCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformUserCommunity";
import { MemberPayload } from "../decorators/payload/MemberPayload";

export async function patchCommunityPlatformMemberUsersUserIdCommunities(props: {
  member: MemberPayload;
  userId: string & tags.Format<"uuid">;
  body: ICommunityPlatformUserCommunityRequest;
}): Promise<IPageICommunityPlatformUserCommunity> {
  const { member, userId, body } = props;

  // Authorization: Ensure member ID matches requested user ID
  if (member.id !== userId) {
    throw new HttpException(
      "Forbidden: User ID does not match authenticated member",
      403,
    );
  }

  // Extract pagination and sorting parameters with defaults
  const limit = body.limit ?? 5;
  const offset = body.offset ?? 0;
  const sortDirection = body.sort_direction ?? "desc";

  // Construct where condition: active memberships only
  const whereCondition = {
    community_platform_user_id: userId,
    deleted_at: null,
  };

  // Construct orderBy clause - ensure type safety with literal types
  const sortingDirections: Record<string, "asc" | "desc"> = {
    asc: "asc",
    desc: "desc",
  };
  const orderBy = {
    last_interaction_at: sortingDirections[sortDirection],
  };

  // Query for paginated results
  const results =
    await MyGlobal.prisma.community_platform_user_communities.findMany({
      where: whereCondition,
      orderBy,
      skip: offset,
      take: limit,
    });

  // Count total records for pagination
  const total = await MyGlobal.prisma.community_platform_user_communities.count(
    {
      where: whereCondition,
    },
  );

  // Map results to ICommunityPlatformUserCommunity type with proper date conversion
  const mappedResults = results.map((record) => ({
    id: record.id,
    community_platform_user_id: record.community_platform_user_id,
    community_platform_community_id: record.community_platform_community_id,
    created_at: toISOStringSafe(record.created_at),
    updated_at: toISOStringSafe(record.updated_at),
    deleted_at: record.deleted_at
      ? toISOStringSafe(record.deleted_at)
      : undefined,
    last_interaction_at: toISOStringSafe(record.last_interaction_at),
  }));

  // Calculate pagination object with plain numbers, ensuring integer for current
  const pagination: IPage.IPagination = {
    current: Math.floor(offset / limit + 1),
    limit: Number(limit),
    records: Number(total),
    pages: Math.ceil(total / limit),
  };

  return {
    pagination,
    data: mappedResults,
  };
}
