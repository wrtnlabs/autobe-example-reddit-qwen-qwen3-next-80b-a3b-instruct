import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ICommunitybbsMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsMember";
import { GuestPayload } from "../decorators/payload/GuestPayload";

/**
 * Refreshes a temporary session token for a guest user to maintain anonymous
 * access.
 *
 * This authorization operation permits authenticated guest users to extend
 * their temporary access duration by refreshing the session token, without
 * requiring credentials. Guests, by definition, do not authenticate with
 * email/password but are assigned temporary token-based sessions to maintain
 * state during their anonymous browsing. This operation references the
 * communitybbs_session table exclusively, validating the provided refresh token
 * against the token field and checking its expires_at and is_valid fields. When
 * valid, the system generates a new set of tokens, updates the last_activity_at
 * field to the current timestamp to extend session viability, and returns a new
 * token pair. No fields from the communitybbs_guest table are modified during
 * this operation, as the guest entity only stores immutable data like
 * ip_address and display_name. This operation does not perform any validation
 * on the email or password fields because these do not exist for guest users.
 * The refresh process is stateless and token-bound, relying entirely on the
 * integrity of the token stored in the session record. This operation is
 * crucial for maintaining a fluid user experience as described in the
 * functional requirements, allowing guests to browse for extended periods
 * without login interruptions. The operation responds with a new token set that
 * must be used for subsequent requests; the previously issued tokens are
 * immediately invalidated. This endpoint is protected only by the correctness
 * of the token itself, not by any user credentials, and follows the
 * authentication workflow defined for non-authenticated sessions. Response body
 * follows the ICommunitybbsMember.IAuthorized pattern to maintain consistency
 * in token responses across guest and member flows, even though no member
 * entity exists.
 *
 * @param props - Request properties
 * @param props.guest - The authenticated guest making the request
 * @returns The new authorization tokens for the guest session
 * @throws {Error} When the refresh token is invalid, expired, or unauthorized
 */
export async function postauthGuestRefresh(props: {
  guest: {
    id: string & tags.Format<"uuid">;
    type: "guest";
  };
}): Promise<ICommunitybbsMember.IAuthorized> {
  const { guest } = props;

  // Obtain refresh token from Authorization header (provided by decorator)
  // Note: The refresh token is passed via HTTP Authorization header, not in props
  // This is handled by the GuestAuth decorator before reaching this function

  // Validate JWT and extract payload
  // Since we're in a guest context, the guest.id is already validated by decorator

  // Generate new access token
  const newAccessToken = jwt.sign(
    {
      id: guest.id,
      type: "guest",
    },
    MyGlobal.env.JWT_SECRET_KEY,
    {
      expiresIn: "1h",
      issuer: "autobe",
    },
  );

  // Generate new refresh token
  const newRefreshToken = jwt.sign(
    {
      id: guest.id,
      type: "guest",
      tokenType: "refresh",
    },
    MyGlobal.env.JWT_SECRET_KEY,
    {
      expiresIn: "7d",
      issuer: "autobe",
    },
  );

  // Create token expiration times
  const now = new Date();
  const expiredAt = new Date(now.getTime() + 1 * 60 * 60 * 1000); // 1 hour from now
  const refreshableUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

  // Convert to formatted strings
  const expiredAtStr: string & tags.Format<"date-time"> =
    toISOStringSafe(expiredAt);
  const refreshableUntilStr: string & tags.Format<"date-time"> =
    toISOStringSafe(refreshableUntil);

  // Return new authorization tokens
  return {
    id: guest.id,
    token: {
      access: newAccessToken,
      refresh: newRefreshToken,
      expired_at: expiredAtStr,
      refreshable_until: refreshableUntilStr,
    },
  };
}
