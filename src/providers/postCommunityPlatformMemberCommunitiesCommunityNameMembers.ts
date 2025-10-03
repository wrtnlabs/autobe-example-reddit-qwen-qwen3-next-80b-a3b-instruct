import { HttpException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import typia, { tags } from "typia";
import { v4 } from "uuid";
import { MyGlobal } from "../MyGlobal";
import { PasswordUtil } from "../utils/PasswordUtil";
import { toISOStringSafe } from "../utils/toISOStringSafe";

import { ICommunityPlatformCommunityPlatformUserCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunityPlatformUserCommunity";
import { MemberPayload } from "../decorators/payload/MemberPayload";

export async function postCommunityPlatformMemberCommunitiesCommunityNameMembers(props: {
  member: MemberPayload;
  communityName: string;
}): Promise<ICommunityPlatformCommunityPlatformUserCommunity> {
  // Validate community exists and is not deleted
  const community =
    await MyGlobal.prisma.community_platform_communities.findUniqueOrThrow({
      where: {
        name: props.communityName,
      },
    });

  // Check if user is already a member (active membership)
  const existingMembership =
    await MyGlobal.prisma.community_platform_user_communities.findUnique({
      where: {
        community_platform_user_id_community_platform_community_id: {
          community_platform_user_id: props.member.id,
          community_platform_community_id: community.id,
        },
      },
    });

  if (existingMembership) {
    throw new HttpException("User is already a member of this community", 409);
  }

  // Create new membership
  const now = toISOStringSafe(new Date());
  const newMembership =
    await MyGlobal.prisma.community_platform_user_communities.create({
      data: {
        id: v4() satisfies string & tags.Format<"uuid">,
        community_platform_user_id: props.member.id,
        community_platform_community_id: community.id,
        created_at: now,
        updated_at: now,
        last_interaction_at: now,
        deleted_at: null,
      },
    });

  return {
    id: newMembership.id,
    created_at: toISOStringSafe(newMembership.created_at),
    updated_at: toISOStringSafe(newMembership.updated_at),
    last_interaction_at: toISOStringSafe(newMembership.last_interaction_at),
    deleted_at: newMembership.deleted_at
      ? toISOStringSafe(newMembership.deleted_at)
      : null,
    community_platform_user_id: newMembership.community_platform_user_id,
    community_platform_community_id:
      newMembership.community_platform_community_id,
  } satisfies ICommunityPlatformCommunityPlatformUserCommunity as ICommunityPlatformCommunityPlatformUserCommunity;
}
