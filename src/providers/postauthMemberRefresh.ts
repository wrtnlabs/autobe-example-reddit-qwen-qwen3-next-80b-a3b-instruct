import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IMember";
import { ICommunitybbsMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsMember";

export async function postauthMemberRefresh(props: {
  body: IMember.IRefresh;
}): Promise<ICommunitybbsMember.IAuthorized> {
  const { refresh_token } = props.body;

  if (!refresh_token) {
    throw new Error("Unauthorized: Refresh token is required");
  }

  const session = await MyGlobal.prisma.communitybbs_session.findFirst({
    where: {
      token: refresh_token,
      deleted_at: null,
      is_valid: true,
    },
  });

  if (!session) {
    throw new Error("Unauthorized: Invalid or expired refresh token");
  }

  const nowISOString = toISOStringSafe(new Date());
  const now = new Date();
  const expiresAt = new Date(session.expires_at);

  if (expiresAt < now) {
    throw new Error("Unauthorized: Refresh token has expired");
  }

  // Calculate new expiration date (30 days from now)
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const newExpiresAt = toISOStringSafe(thirtyDaysFromNow);
  const newRefreshableUntil = newExpiresAt;

  // Update session
  await MyGlobal.prisma.communitybbs_session.update({
    where: { id: session.id },
    data: {
      expires_at: newExpiresAt,
      last_activity_at: nowISOString,
      updated_at: nowISOString,
    },
  });

  // Generate new tokens
  const newAccessToken = jwt.sign(
    { userId: session.actor_id },
    MyGlobal.env.JWT_SECRET_KEY,
    { expiresIn: "1h", issuer: "autobe" },
  );

  const newRefreshToken = jwt.sign(
    { userId: session.actor_id, tokenType: "refresh" },
    MyGlobal.env.JWT_SECRET_KEY,
    { expiresIn: "7d", issuer: "autobe" },
  );

  return {
    id: session.actor_id,
    token: {
      access: newAccessToken,
      refresh: newRefreshToken,
      expired_at: newExpiresAt,
      refreshable_until: newRefreshableUntil,
    },
  } satisfies ICommunitybbsMember.IAuthorized;
}
