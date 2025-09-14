import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ICommunitybbsMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsMember";
import { GuestPayload } from "../decorators/payload/GuestPayload";

export async function postauthGuestRefresh(props: {
  guest: GuestPayload;
}): Promise<ICommunitybbsMember.IAuthorized> {
  const { id: guestId } = props.guest;

  // Find the active session by actor_id and is_valid status
  // The session token is validated by the GuestAuth decorator, so we only need to find session for this guest
  const session = await MyGlobal.prisma.communitybbs_session.findFirst({
    where: {
      actor_id: guestId,
      is_valid: true,
    },
  });

  // If session not found or not valid, throw error
  if (!session) {
    throw new Error("Invalid or expired session");
  }

  // Update the session to extend its life by updating last_activity_at and updated_at
  await MyGlobal.prisma.communitybbs_session.update({
    where: { id: session.id },
    data: {
      last_activity_at: toISOStringSafe(new Date()),
      updated_at: toISOStringSafe(new Date()),
    },
  });

  // Generate new access token
  const accessToken = jwt.sign(
    { userId: guestId },
    MyGlobal.env.JWT_SECRET_KEY,
    { expiresIn: "1h", issuer: "autobe" },
  );

  // Generate new refresh token
  const refreshToken = jwt.sign(
    { userId: guestId, tokenType: "refresh" },
    MyGlobal.env.JWT_SECRET_KEY,
    { expiresIn: "7d", issuer: "autobe" },
  );

  // Return ICommunitybbsMember.IAuthorized conforming structure
  return {
    id: guestId,
    token: {
      access: accessToken,
      refresh: refreshToken,
      expired_at: toISOStringSafe(new Date(Date.now() + 3600000)),
      refreshable_until: toISOStringSafe(new Date(Date.now() + 604800000)),
    },
  };
}
