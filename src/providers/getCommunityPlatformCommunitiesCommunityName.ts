import { HttpException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import typia, { tags } from "typia";
import { v4 } from "uuid";
import { MyGlobal } from "../MyGlobal";
import { PasswordUtil } from "../utils/PasswordUtil";
import { toISOStringSafe } from "../utils/toISOStringSafe";

import { ICommunityPlatformCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunity";

export async function getCommunityPlatformCommunitiesCommunityName(props: {
  communityName: string &
    tags.Pattern<"^[a-zA-Z0-9_-]+$"> &
    tags.MinLength<5> &
    tags.MaxLength<64>;
}): Promise<ICommunityPlatformCommunity> {
  const community =
    await MyGlobal.prisma.community_platform_communities.findFirst({
      where: {
        name: props.communityName,
      },
      include: {
        community_platform_community_stats: true,
      },
    });

  if (!community) {
    throw new HttpException("Not Found", 404);
  }

  const result = {
    id: community.id,
    name: community.name,
    category: community.category as
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
    description: community.description ?? undefined,
    rules: community.rules ?? undefined,
    logo_url: community.logo_url ?? undefined,
    banner_url: community.banner_url ?? undefined,
    member_count:
      community.community_platform_community_stats?.member_count ?? 0,
    created_at: toISOStringSafe(community.created_at),
  } satisfies ICommunityPlatformCommunity;

  return result;
}
