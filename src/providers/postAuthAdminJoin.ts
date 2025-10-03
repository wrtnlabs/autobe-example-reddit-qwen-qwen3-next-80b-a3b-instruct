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

export async function postAuthAdminJoin(props: {
  body: ICommunityPlatformAdmin.IJoin;
}): Promise<ICommunityPlatformAdmin.IAuthorized> {
  const { email, password, displayName } = props.body;

  // Generate new UUID for member account
  const memberId = v4() as string & tags.Format<"uuid">;

  // Hash password
  const hashedPassword = await PasswordUtil.hash(password);

  try {
    // Create member account in community_platform_member table
    const member = await MyGlobal.prisma.community_platform_member.create({
      data: {
        id: memberId,
        email,
        password_hash: hashedPassword,
        display_name: displayName ?? undefined,
        created_at: toISOStringSafe(new Date()),
      },
    });

    // Create admin record linking to member account
    const adminRecord = await MyGlobal.prisma.community_platform_admin.create({
      data: {
        id: v4() as string & tags.Format<"uuid">,
        member_id: member.id,
        created_at: toISOStringSafe(new Date()),
      },
    });

    // Generate JWT tokens
    const expiresAt = toISOStringSafe(new Date(Date.now() + 3600000)); // 1 hour
    const refreshableUntil = toISOStringSafe(new Date(Date.now() + 604800000)); // 7 days

    const accessToken = jwt.sign(
      {
        id: member.id,
        email: member.email,
        type: "admin",
      },
      MyGlobal.env.JWT_SECRET_KEY,
      {
        expiresIn: "1h",
        issuer: "autobe",
      },
    );

    const refreshToken = jwt.sign(
      {
        id: member.id,
        tokenType: "refresh",
      },
      MyGlobal.env.JWT_SECRET_KEY,
      {
        expiresIn: "7d",
        issuer: "autobe",
      },
    );

    // Return response in required format
    return {
      id: member.id,
      member_id: member.id,
      token: {
        access: accessToken,
        refresh: refreshToken,
        expired_at: expiresAt,
        refreshable_until: refreshableUntil,
      },
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new HttpException("Email already registered", 409);
    }
    throw new HttpException("Failed to register admin account", 500);
  }
}
