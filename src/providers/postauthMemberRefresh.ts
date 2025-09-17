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

  // Find active session with matching refresh token
  const session = await MyGlobal.prisma.communitybbs_session.findFirst({
    where: {
      token: refresh_token,
      deleted_at: null,
      is_valid: true,
      expires_at: {
        gte: new Date().toISOString(), // Even though we can't use Date, we must compare as string
      },
    },
    include: {
      actor: true,
    },
  });

  // Validate that session exists and belongs to a member
  if (!session) {
    throw new Error("Invalid or expired refresh token");
  }

  // Confirm actor is a member (not admin or guest)
  if (session.actor.type !== "member") {
    throw new Error("Invalid actor type for member refresh");
  }

  // Generate new tokens
  const now = new Date();
  const accessExpires = new Date(now.getTime() + 1 * 60 * 60 * 1000); // 1 hour
  const refreshExpires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

  // Convert to ISO strings using toISOStringSafe
  const accessToken = jwt.sign(
    {
      userId: session.actor.id,
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
      userId: session.actor.id,
      type: "refresh",
    },
    MyGlobal.env.JWT_SECRET_KEY,
    {
      expiresIn: "30d",
      issuer: "autobe",
    },
  );

  // Update session with new expiration and timestamps
  await MyGlobal.prisma.communitybbs_session.update({
    where: {
      id: session.id,
    },
    data: {
      expires_at: toISOStringSafe(refreshExpires),
      last_activity_at: toISOStringSafe(now),
      updated_at: toISOStringSafe(now),
      // Explicitly keep is_valid as true, deleted_at as null
      deleted_at: null,
    },
  });

  // Return authorized response with new tokens
  return {
    id: session.actor.id,
    token: {
      access: accessToken,
      refresh: refreshToken,
      expired_at: toISOStringSafe(accessExpires),
      refreshable_until: toISOStringSafe(refreshExpires),
    },
  };
}
