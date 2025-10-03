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

export async function postAuthMemberLogin(props: {
  member: MemberPayload;
  body: IMember.ILogin;
}): Promise<ICommunityPlatformMember.IAuthorized> {
  const { email, password_hash } = props.body;

  // Find member by email and ensure account is not deleted
  const member = await MyGlobal.prisma.community_platform_member.findUnique({
    where: {
      email,
      deleted_at: null,
    },
  });

  // If member not found or password invalid, throw unauthorized
  if (!member) {
    throw new HttpException("Invalid credentials", 401);
  }

  // Verify password using PasswordUtil
  const isValid = await PasswordUtil.verify(
    password_hash,
    member.password_hash,
  );
  if (!isValid) {
    throw new HttpException("Invalid credentials", 401);
  }

  // Generate token timestamps using toISOStringSafe
  const now = toISOStringSafe(new Date());
  const expired_at = toISOStringSafe(
    new Date(new Date(now).getTime() + 30 * 60 * 1000),
  ); // 30 minutes
  const refreshable_until = toISOStringSafe(
    new Date(new Date(now).getTime() + 30 * 24 * 60 * 60 * 1000),
  ); // 30 days

  // Generate JWT tokens with explicit issuer 'autobe'
  const accessToken = jwt.sign(
    {
      userId: member.id,
      email: member.email,
      type: "member",
    },
    MyGlobal.env.JWT_SECRET_KEY,
    {
      expiresIn: "30m",
      issuer: "autobe",
    },
  );

  const refreshToken = jwt.sign(
    {
      userId: member.id,
      tokenType: "refresh",
    },
    MyGlobal.env.JWT_SECRET_KEY,
    {
      expiresIn: "30d",
      issuer: "autobe",
    },
  );

  // Return response with all date fields converted using toISOStringSafe()
  return {
    id: member.id,
    email: member.email,
    display_name:
      member.display_name !== null
        ? (member.display_name satisfies string as string)
        : undefined,
    created_at: toISOStringSafe(member.created_at),
    last_login_at: member.last_login_at
      ? toISOStringSafe(member.last_login_at)
      : undefined,
    deleted_at: member.deleted_at
      ? toISOStringSafe(member.deleted_at)
      : undefined,
    token: {
      access: accessToken,
      refresh: refreshToken,
      expired_at,
      refreshable_until,
    },
  };
}
