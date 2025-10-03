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

export async function postAuthAdminRefresh(props: {
  admin: AdminPayload;
  body: ICommunityPlatformAdmin.IRefresh;
}): Promise<ICommunityPlatformAdmin.IAuthorized> {
  const { refresh_token } = props.body;

  try {
    // Decode and verify the refresh token
    const decoded = jwt.verify(refresh_token, MyGlobal.env.JWT_SECRET_KEY, {
      issuer: "autobe",
    }) as { userId: string };

    // Validate admin exists and is not deleted
    const admin = await MyGlobal.prisma.community_platform_admin.findFirst({
      where: {
        member_id: decoded.userId,
        deleted_at: null,
      },
    });

    if (!admin) {
      throw new HttpException("Invalid or expired refresh token", 401);
    }

    // Generate new access token
    const accessToken = jwt.sign(
      {
        userId: decoded.userId,
        type: "admin",
      },
      MyGlobal.env.JWT_SECRET_KEY,
      {
        expiresIn: "30m",
        issuer: "autobe",
      },
    );

    // Generate new refresh token (rotated)
    const newRefreshToken = jwt.sign(
      {
        userId: decoded.userId,
        tokenType: "refresh",
      },
      MyGlobal.env.JWT_SECRET_KEY,
      {
        expiresIn: "7d",
        issuer: "autobe",
      },
    );

    // Construct and return response with fully typed date-time strings
    const now = new Date();
    const expiredAt = toISOStringSafe(new Date(now.getTime() + 30 * 60 * 1000));
    const refreshableUntil = toISOStringSafe(
      new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    );

    return {
      id: decoded.userId,
      member_id: decoded.userId,
      token: {
        access: accessToken,
        refresh: newRefreshToken,
        expired_at: expiredAt,
        refreshable_until: refreshableUntil,
      },
    };
  } catch (error) {
    console.error("Admin refresh token validation failed:", error);
    throw new HttpException("Invalid refresh token", 401);
  }
}
