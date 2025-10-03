import { HttpException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import typia, { tags } from "typia";
import { v4 } from "uuid";
import { MyGlobal } from "../MyGlobal";
import { PasswordUtil } from "../utils/PasswordUtil";
import { toISOStringSafe } from "../utils/toISOStringSafe";

import { ICommunityPlatformGuest } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformGuest";
import { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import { GuestPayload } from "../decorators/payload/GuestPayload";

export async function postAuthGuestJoin(props: {
  guest: GuestPayload;
}): Promise<ICommunityPlatformGuest.IAuthorized> {
  // Generate new guest session ID
  const guestId: string & tags.Format<"uuid"> = v4();

  // Create guest entry in database
  const createdGuest = await MyGlobal.prisma.community_platform_guest.create({
    data: {
      id: guestId,
      created_at: toISOStringSafe(new Date()),
      ip_address: undefined,
    },
  });

  // Calculate token expiration times
  const now = new Date();
  const expiredAt = new Date(now.getTime() + 60 * 60 * 1000);
  const refreshableUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Generate JWT tokens
  const accessToken = jwt.sign(
    {
      id: guestId,
      type: "guest",
    },
    MyGlobal.env.JWT_SECRET_KEY,
    {
      expiresIn: "1h",
      issuer: "autobe",
    },
  );

  const refreshToken = jwt.sign(
    {
      id: guestId,
      tokenType: "refresh",
    },
    MyGlobal.env.JWT_SECRET_KEY,
    {
      expiresIn: "7d",
      issuer: "autobe",
    },
  );

  // Convert expiration dates to branded strings (allowed exception for trusted conversion)
  const expiredAtStr: string & tags.Format<"date-time"> =
    expiredAt.toISOString() as string & tags.Format<"date-time">;
  const refreshableUntilStr: string & tags.Format<"date-time"> =
    refreshableUntil.toISOString() as string & tags.Format<"date-time">;

  return {
    id: createdGuest.id,
    created_at: toISOStringSafe(createdGuest.created_at),
    ip_address: undefined, // No IP source in props; API allows undefined
    token: {
      access: accessToken,
      refresh: refreshToken,
      expired_at: expiredAtStr,
      refreshable_until: refreshableUntilStr,
    },
  };
}
