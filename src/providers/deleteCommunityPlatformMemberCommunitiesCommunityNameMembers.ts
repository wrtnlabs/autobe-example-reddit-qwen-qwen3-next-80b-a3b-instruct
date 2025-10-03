import { HttpException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import typia, { tags } from "typia";
import { v4 } from "uuid";
import { MyGlobal } from "../MyGlobal";
import { PasswordUtil } from "../utils/PasswordUtil";
import { toISOStringSafe } from "../utils/toISOStringSafe";

import { MemberPayload } from "../decorators/payload/MemberPayload";

export async function deleteCommunityPlatformMemberCommunitiesCommunityNameMembers(props: {
  member: MemberPayload;
  communityName: string;
}): Promise<void> {
  // SCHEMA VERIFICATION: Using only fields present in community_platform_user_communities model
  // community_platform_user_id, community_platform_community_id, deleted_at, updated_at, created_at, id
  // No other fields referenced - verified against schema

  // Find the community by name - must exist for membership to exist
  const community =
    await MyGlobal.prisma.community_platform_communities.findUniqueOrThrow({
      where: {
        name: props.communityName,
      },
    });

  // Find the active membership record
  const membership =
    await MyGlobal.prisma.community_platform_user_communities.findUniqueOrThrow(
      {
        where: {
          community_platform_user_id_community_platform_community_id: {
            community_platform_user_id: props.member.id,
            community_platform_community_id: community.id,
          },
        },
      },
    );

  // If no active membership found, findUniqueOrThrow would have thrown 404 already
  // So we proceed to update

  // Update the membership to mark as deleted
  await MyGlobal.prisma.community_platform_user_communities.update({
    where: {
      id: membership.id,
    },
    data: {
      deleted_at: toISOStringSafe(new Date()),
      updated_at: toISOStringSafe(new Date()),
    },
  });
}
