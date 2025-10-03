import { HttpException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import typia, { tags } from "typia";
import { v4 } from "uuid";
import { MyGlobal } from "../MyGlobal";
import { PasswordUtil } from "../utils/PasswordUtil";
import { toISOStringSafe } from "../utils/toISOStringSafe";

import { ICommunityPlatformSearchCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformSearchCommunity";

export async function getCommunityPlatformSearchSubCommunitiesCommunityId(props: {
  communityId: string & tags.Format<"uuid">;
}): Promise<ICommunityPlatformSearchCommunity> {
  const community =
    await MyGlobal.prisma.community_platform_search_communities.findUnique({
      where: {
        community_id: props.communityId,
      },
    });

  if (!community) {
    throw new HttpException("Community not found", 404);
  }

  return {
    id: community.id,
    community_id: community.community_id,
    name: community.name,
    description: community.description ?? undefined,
    category: typia.assert<
      | "Tech & Programming"
      | "Science"
      | "Movies & TV"
      | "Games"
      | "Sports"
      | "Lifestyle & Wellness"
      | "Study & Education"
      | "Art & Design"
      | "Business & Finance"
      | "News & Current Affairs"
    >(community.category),
    member_count: community.member_count,
    created_at: toISOStringSafe(community.created_at),
    updated_at: toISOStringSafe(community.updated_at),
  };
}
