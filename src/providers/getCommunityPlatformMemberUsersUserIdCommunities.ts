import { HttpException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import typia, { tags } from "typia";
import { v4 } from "uuid";
import { MyGlobal } from "../MyGlobal";
import { PasswordUtil } from "../utils/PasswordUtil";
import { toISOStringSafe } from "../utils/toISOStringSafe";

import { ICommunityPlatformIPageICommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformIPageICommunity";
import { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import { ICommunityPlatformCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunity";
import { MemberPayload } from "../decorators/payload/MemberPayload";

export async function getCommunityPlatformMemberUsersUserIdCommunities(props: {
  member: MemberPayload;
  userId: string & tags.Format<"uuid">;
}): Promise<ICommunityPlatformIPageICommunity.ISummary> {
  // SECURITY CHECK: Ensure authenticated user matches requested userId
  if (props.member.id !== props.userId) {
    throw new HttpException(
      "Unauthorized: Cannot access another user’s communities",
      403,
    );
  }

  // FETCH COMMUNITIES (LIMIT 5)
  const communities =
    await MyGlobal.prisma.community_platform_user_communities.findMany({
      where: {
        community_platform_user_id: props.userId,
        deleted_at: null,
      },
      orderBy: {
        last_interaction_at: "desc",
      },
      take: 5,
      include: {
        community: true,
      },
    });

  // PREPARE COMMUNITY SUMMARY ARRAY
  const data: ICommunityPlatformCommunity.ISummary[] = communities.map((c) => ({
    id: c.community.id,
    name: c.community.name,
    category: c.community.category satisfies string as
      | "Tech & Programming"
      | "Science"
      | "Movies & TV"
      | "Games"
      | "Sports"
      | "Lifestyle & Wellness"
      | "Study & Education"
      | "Art & Design"
      | "Business & Finance"
      | "News & Current Affairs",
    description: c.community.description ?? undefined,
    member_count: c.community.member_count,
    created_at: toISOStringSafe(c.community.created_at),
  }));

  // COUNT TOTAL ACTIVE COMMUNITIES FOR PAGINATION
  const totalActive =
    await MyGlobal.prisma.community_platform_user_communities.count({
      where: {
        community_platform_user_id: props.userId,
        deleted_at: null,
      },
    });

  // BUILD PAGINATION - STRIP BRAND TYPES WITH Number()
  const pagination: IPage.IPagination = {
    current: Number(1),
    limit: Number(5),
    records: totalActive,
    pages: totalActive > 0 ? Number(Math.ceil(totalActive / 5)) : 1,
  };

  // RETURN
  return {
    pagination,
    data,
  };
}
