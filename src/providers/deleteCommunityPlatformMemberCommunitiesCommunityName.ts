import { HttpException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import typia, { tags } from "typia";
import { v4 } from "uuid";
import { MyGlobal } from "../MyGlobal";
import { PasswordUtil } from "../utils/PasswordUtil";
import { toISOStringSafe } from "../utils/toISOStringSafe";

import { MemberPayload } from "../decorators/payload/MemberPayload";

export async function deleteCommunityPlatformMemberCommunitiesCommunityName(props: {
  member: MemberPayload;
  communityName: string &
    tags.Pattern<"^[a-zA-Z0-9_-]+$"> &
    tags.MinLength<5> &
    tags.MaxLength<64>;
}): Promise<void> {
  const { member, communityName } = props;

  // Find the community by name
  const community =
    await MyGlobal.prisma.community_platform_communities.findUnique({
      where: { name: communityName },
    });

  if (!community) {
    throw new HttpException("Community not found", 404);
  }

  // Find the creator: first member who joined the community
  const creatorMembership =
    await MyGlobal.prisma.community_platform_user_communities.findFirst({
      where: {
        community_platform_community_id: community.id,
      },
      orderBy: {
        created_at: "asc",
      },
    });

  // Check if user is the creator
  const isCreator = creatorMembership?.community_platform_user_id === member.id;

  // Check if user is admin
  const isAdmin = await MyGlobal.prisma.community_platform_admin.findUnique({
    where: {
      member_id: member.id,
      deleted_at: null,
    },
  });

  // If user is not creator and not admin, deny access
  if (!isCreator && !isAdmin) {
    throw new HttpException(
      "You can only delete communities you created.",
      403,
    );
  }

  // Delete the community — cascade deletes all related records
  await MyGlobal.prisma.community_platform_communities.delete({
    where: { id: community.id },
  });

  return;
}
