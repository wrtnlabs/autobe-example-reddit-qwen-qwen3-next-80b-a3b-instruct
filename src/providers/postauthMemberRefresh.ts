import { HttpException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import typia, { tags } from "typia";
import { v4 } from "uuid";
import { MyGlobal } from "../MyGlobal";
import { PasswordUtil } from "../utils/PasswordUtil";
import { toISOStringSafe } from "../utils/toISOStringSafe";

import { IMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IMember";
import { ICommunityPlatformMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformMember";
import { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import { MemberPayload } from "../decorators/payload/MemberPayload";

export async function postAuthMemberRefresh(props: {
  member: MemberPayload;
  body: IMember.IRefresh;
}): Promise<ICommunityPlatformMember.IAuthorized> {
  // Decode and verify the refresh token
  let decoded: { userId: string };
  try {
    decoded = jwt.verify(
      props.body.refreshToken,
      MyGlobal.env.JWT_SECRET_KEY,
    ) as {
      userId: string;
    };
  } catch {
    throw new HttpException("Invalid or expired refresh token", 401);
  }

  // Find member by id from decoded token
  const member = await MyGlobal.prisma.community_platform_member.findFirst({
    where: {
      id: decoded.userId,
      deleted_at: null,
    },
  });

  // If member doesn't exist or is deleted, return 401
  if (!member) {
    throw new HttpException("Member not found or deactivated", 401);
  }

  // Update last_login_at to current time in UTC
  const now = toISOStringSafe(new Date());

  // Update the last_login_at field
  await MyGlobal.prisma.community_platform_member.update({
    where: { id: decoded.userId },
    data: { last_login_at: now },
  });

  // Issue new access token with same payload as login
  const newAccessToken = jwt.sign(
    {
      id: member.id,
      email: member.email,
      display_name: member.display_name,
      created_at: toISOStringSafe(member.created_at),
      last_login_at: member.last_login_at
        ? toISOStringSafe(member.last_login_at)
        : null,
      deleted_at: member.deleted_at ? toISOStringSafe(member.deleted_at) : null,
    },
    MyGlobal.env.JWT_SECRET_KEY,
    {
      expiresIn: "30m",
      issuer: "autobe",
    },
  );

  // Refresh token remains the same — refreshable_until unchanged (30 days from issuance)
  // Create a Date 30 days from now
  const refreshableUntil = toISOStringSafe(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  );

  return {
    id: member.id,
    email: member.email, // FIXED: Direct assignment - email is required field, never null/undefined in schema
    display_name:
      member.display_name === null || member.display_name === undefined
        ? undefined
        : (member.display_name satisfies string as string),
    created_at: toISOStringSafe(member.created_at), // FIXED: Direct conversion - created_at is required field, never null/undefined in schema
    last_login_at: now,
    deleted_at: member.deleted_at
      ? toISOStringSafe(member.deleted_at)
      : undefined,
    token: {
      access: newAccessToken,
      refresh: props.body.refreshToken,
      expired_at: toISOStringSafe(new Date(Date.now() + 30 * 60 * 1000)),
      refreshable_until: refreshableUntil,
    },
  };
}
