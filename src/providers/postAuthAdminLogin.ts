import { HttpException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import typia, { tags } from "typia";
import { v4 } from "uuid";
import { MyGlobal } from "../MyGlobal";
import { PasswordUtil } from "../utils/PasswordUtil";
import { toISOStringSafe } from "../utils/toISOStringSafe";

import { ICommunityPlatformAdmin } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformAdmin";
import { ICommunityPlatformAdminMemberId } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformAdminMemberId";
import { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import { AdminPayload } from "../decorators/payload/AdminPayload";

export async function postAuthAdminLogin(props: {
  admin: AdminPayload;
  body: ICommunityPlatformAdmin.ILogin;
}): Promise<ICommunityPlatformAdmin.IAuthorized> {
  const { email, password } = props.body;

  // Find member by email with active status (deleted_at is null)
  const member = await MyGlobal.prisma.community_platform_member.findFirst({
    where: {
      email,
      deleted_at: null,
    },
  });

  // If no member found or deactivated, reject authentication
  if (!member) {
    throw new HttpException("Invalid credentials", 401);
  }

  // Verify password hash
  const isValid = await PasswordUtil.verify(password, member.password_hash);
  if (!isValid) {
    throw new HttpException("Invalid credentials", 401);
  }

  // Verify admin privileges by checking community_platform_admin
  const admin = await MyGlobal.prisma.community_platform_admin.findFirst({
    where: {
      member_id: member.id,
      deleted_at: null,
    },
  });

  // If no admin record found, access is forbidden
  if (!admin) {
    throw new HttpException("You're not enrolled", 403);
  }

  // Generate token expiration timestamps
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 60 * 1000);
  const refreshExpiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const accessToken = jwt.sign(
    {
      userId: member.id,
      type: "admin",
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

  return {
    id: member.id,
    member_id: member.id,
    token: {
      access: accessToken,
      refresh: refreshToken,
      expired_at: toISOStringSafe(expiresAt),
      refreshable_until: toISOStringSafe(refreshExpiresAt),
    },
  };
}
