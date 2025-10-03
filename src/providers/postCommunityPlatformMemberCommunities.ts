import { HttpException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import typia, { tags } from "typia";
import { v4 } from "uuid";
import { MyGlobal } from "../MyGlobal";
import { PasswordUtil } from "../utils/PasswordUtil";
import { toISOStringSafe } from "../utils/toISOStringSafe";

import { ICommunityPlatformCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunity";
import { MemberPayload } from "../decorators/payload/MemberPayload";

export async function postCommunityPlatformMemberCommunities(props: {
  member: MemberPayload;
  body: ICommunityPlatformCommunity.ICreate;
}): Promise<ICommunityPlatformCommunity> {
  const { body } = props;

  // Check for existing community with same name
  const existing =
    await MyGlobal.prisma.community_platform_communities.findFirst({
      where: { name: body.name },
    });

  if (existing) {
    throw new HttpException("This name is already in use.", 409);
  }

  // Create the community
  const created = await MyGlobal.prisma.community_platform_communities.create({
    data: {
      id: v4(),
      name: body.name,
      category: body.category,
      description: body.description === null ? undefined : body.description,
      rules: body.rules === null ? undefined : body.rules,
      logo_url: body.logo_url === null ? undefined : body.logo_url,
      banner_url: body.banner_url === null ? undefined : body.banner_url,
      member_count: 1,
      created_at: toISOStringSafe(new Date()),
    },
  });

  // Create membership record for creator
  await MyGlobal.prisma.community_platform_user_communities.create({
    data: {
      id: v4(),
      community_platform_user_id: props.member.id,
      community_platform_community_id: created.id,
      created_at: toISOStringSafe(new Date()),
      updated_at: toISOStringSafe(new Date()),
      last_interaction_at: toISOStringSafe(new Date()),
      deleted_at: undefined,
    },
  });

  // Return full community object with all fields
  return {
    id: created.id,
    name: created.name,
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
    >(created.category),
    description: (created.description ?? "") satisfies string as string,
    rules: (created.rules ?? "") satisfies string as string,
    logo_url: (created.logo_url ?? "") satisfies string as string,
    banner_url: (created.banner_url ?? "") satisfies string as string,
    member_count: created.member_count,
    created_at: toISOStringSafe(created.created_at),
  };
}
