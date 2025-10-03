import { HttpException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import typia, { tags } from "typia";
import { v4 } from "uuid";
import { MyGlobal } from "../MyGlobal";
import { PasswordUtil } from "../utils/PasswordUtil";
import { toISOStringSafe } from "../utils/toISOStringSafe";

import { ICommunityPlatformMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformMember";
import { MemberPayload } from "../decorators/payload/MemberPayload";

export async function getCommunityPlatformMemberMembersMemberId(props: {
  member: MemberPayload;
  memberId: string & tags.Format<"uuid">;
}): Promise<ICommunityPlatformMember> {
  // Verify that the requester's member ID matches the requested member ID
  // This ensures the endpoint only returns a user's own profile
  if (props.member.id !== props.memberId) {
    throw new HttpException(
      "Unauthorized: You can only access your own profile",
      403,
    );
  }

  // Query the member profile from the database
  const member = await MyGlobal.prisma.community_platform_member.findUnique({
    where: {
      id: props.memberId,
      deleted_at: null, // Soft delete filter - only active members
    },
    // Select only the fields exposed in ICommunityPlatformMember
    select: {
      id: true,
      email: true,
      display_name: true,
      created_at: true,
      last_login_at: true,
    },
  });

  // If no member found with the given ID and active status, return 404
  if (!member) {
    throw new HttpException("Member not found", 404);
  }

  // Return the profile data with proper type conversion
  // NOTE: Prisma returns Date objects for datetime fields, convert to ISO strings
  return {
    id: member.id,
    email: member.email,
    display_name: member.display_name ?? undefined,
    created_at: toISOStringSafe(member.created_at),
    last_login_at: member.last_login_at
      ? toISOStringSafe(member.last_login_at)
      : undefined,
  };
}
