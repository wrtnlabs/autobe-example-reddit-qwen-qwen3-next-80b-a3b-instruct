import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ICommunitybbsAdministrator } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsAdministrator";
import { AdministratorPayload } from "../decorators/payload/AdministratorPayload";

export async function postauthAdministratorRefresh(props: {
  administrator: AdministratorPayload;
}): Promise<ICommunitybbsAdministrator.IAuthorized> {
  const { administrator } = props;

  // Find the active session for this administrator
  const session = await MyGlobal.prisma.communitybbs_session.findFirst({
    where: {
      actor_id: administrator.id,
      is_valid: true,
      deleted_at: null,
      expires_at: { gt: toISOStringSafe(new Date()) },
    },
  });

  if (!session) {
    throw new Error("Invalid or expired session");
  }

  // Calculate new expiration (30 days from now)
  const newExpiresAt: string & tags.Format<"date-time"> = toISOStringSafe(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  );
  const newLastActivityAt: string & tags.Format<"date-time"> = toISOStringSafe(
    new Date(),
  );

  // Update session to extend validity
  await MyGlobal.prisma.communitybbs_session.update({
    where: { id: session.id },
    data: {
      expires_at: newExpiresAt,
      last_activity_at: newLastActivityAt,
    },
  });

  // Create new access token with same payload
  const newAccessToken = jwt.sign(
    {
      userId: administrator.id,
      type: "administrator",
    },
    MyGlobal.env.JWT_SECRET_KEY,
    {
      expiresIn: "1h",
      issuer: "autobe",
    },
  );

  // Create new refresh token
  const newRefreshToken = jwt.sign(
    {
      userId: administrator.id,
      type: "refresh",
    },
    MyGlobal.env.JWT_SECRET_KEY,
    {
      expiresIn: "30d",
      issuer: "autobe",
    },
  );

  // Return authorized response matching ICommunitybbsAdministrator.IAuthorized
  return {
    id: administrator.id,
    token: {
      access: newAccessToken,
      refresh: newRefreshToken,
      expired_at: newExpiresAt,
      refreshable_until: newExpiresAt,
    },
  };
}
