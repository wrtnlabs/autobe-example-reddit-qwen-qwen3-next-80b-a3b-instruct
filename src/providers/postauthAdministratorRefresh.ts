import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ICommunitybbsAdministrator } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsAdministrator";
import { AdministratorPayload } from "../decorators/payload/AdministratorPayload";

/**
 * Refreshes the administrator's active session token.
 *
 * This endpoint extends the validity of an existing session using a valid
 * refresh token. Each refresh updates the expires_at and last_activity_at
 * fields in the communitybbs_session table, giving the administrator
 * uninterrupted access without requiring a full re-login.
 *
 * @param props - Request properties
 * @param props.administrator - The authenticated administrator making the
 *   request
 * @returns The updated authorization token
 * @throws {Error} When the administrator account is not found
 * @throws {Error} When the session is not found, expired, revoked, or deleted
 */
export async function postauthAdministratorRefresh(props: {
  administrator: {
    id: string & tags.Format<"uuid">;
    type: "administrator";
  };
}): Promise<ICommunitybbsAdministrator.IAuthorized> {
  const { administrator } = props;

  // Find the administrator by ID (using only id, since deleted_at is excluded from WhereInput)
  const administratorRecord =
    await MyGlobal.prisma.communitybbs_administrator.findUniqueOrThrow({
      where: { id: administrator.id },
    });

  // Find the associated active session using the session_id from administrator
  const session = await MyGlobal.prisma.communitybbs_session.findUniqueOrThrow({
    where: { id: administratorRecord.session_id },
  });

  // Validate session is still valid
  if (session.deleted_at !== null || !session.is_valid) {
    throw new Error("Session invalid or revoked");
  }

  // Validate session not expired
  const now = new Date();
  if (session.expires_at < now) {
    throw new Error("Session expired");
  }

  // Generate new tokens
  const newAccessJwt = jwt.sign(
    {
      id: administratorRecord.id,
      type: "administrator",
    },
    MyGlobal.env.JWT_SECRET_KEY,
    {
      expiresIn: "1h",
      issuer: "autobe",
    },
  );

  const newRefreshJwt = jwt.sign(
    {
      id: administratorRecord.id,
      type: "refresh",
    },
    MyGlobal.env.JWT_SECRET_KEY,
    {
      expiresIn: "7d",
      issuer: "autobe",
    },
  );

  // Update session with new timestamps
  const updatedSession = await MyGlobal.prisma.communitybbs_session.update({
    where: { id: session.id },
    data: {
      expires_at: toISOStringSafe(
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ), // 7 days
      last_activity_at: toISOStringSafe(now),
      updated_at: toISOStringSafe(now),
    },
  });

  // Return structure matching IAuthorized
  return {
    id: administratorRecord.id,
    token: {
      access: newAccessJwt,
      refresh: newRefreshJwt,
      expired_at: toISOStringSafe(new Date(Date.now() + 60 * 60 * 1000)), // 1h
      refreshable_until: toISOStringSafe(
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ), // 7d
    },
  };
}
