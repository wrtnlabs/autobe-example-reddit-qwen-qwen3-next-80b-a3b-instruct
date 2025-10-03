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

export async function postAuthMemberJoin(props: {
  member: MemberPayload;
  body: IMember.IJoin;
}): Promise<ICommunityPlatformMember.IAuthorized> {
  const { email, password_hash } = props.body;

  try {
    // Always hash password server-side for security (even if provided)
    const hashedPassword = await PasswordUtil.hash(password_hash);

    // Create new member record with ID and timestamps
    const created = await MyGlobal.prisma.community_platform_member.create({
      data: {
        id: v4(),
        email,
        password_hash: hashedPassword,
        created_at: toISOStringSafe(new Date()),
      },
    });

    // Generate JWT tokens with consistent timestamp reference
    const now = new Date();
    const expiredAt = new Date(now.getTime() + 3600000);
    const refreshableUntil = new Date(now.getTime() + 604800000);

    const accessToken = jwt.sign(
      {
        userId: created.id,
        email: created.email,
        type: "member",
      },
      MyGlobal.env.JWT_SECRET_KEY,
      {
        expiresIn: "1h",
        issuer: "autobe",
      },
    );

    const refreshToken = jwt.sign(
      {
        userId: created.id,
        tokenType: "refresh",
      },
      MyGlobal.env.JWT_SECRET_KEY,
      {
        expiresIn: "7d",
        issuer: "autobe",
      },
    );

    // Return fully typed response with strict string & tags.Format<'date-time'>
    return {
      id: created.id,
      email: created.email,
      display_name: created.display_name ?? undefined,
      created_at: toISOStringSafe(created.created_at),
      last_login_at: created.last_login_at
        ? toISOStringSafe(created.last_login_at)
        : undefined,
      deleted_at: created.deleted_at
        ? toISOStringSafe(created.deleted_at)
        : undefined,
      token: {
        access: accessToken,
        refresh: refreshToken,
        expired_at: toISOStringSafe(expiredAt),
        refreshable_until: toISOStringSafe(refreshableUntil),
      },
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        // Unique constraint failed
        throw new HttpException("Email already registered", 409);
      }
    }
    throw new HttpException("Internal server error", 500);
  }
}
