import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ICommunitybbsMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsMember";
import { GuestPayload } from "../decorators/payload/GuestPayload";

/**
 * Registers a guest user as a member by creating a new member record and
 * issuing initial JWT tokens.
 *
 * This authorization operation enables unauthenticated guests to register as
 * members of the Community BBS platform. The operation is triggered when a user
 * initiates the account creation flow, translating the guest state into a
 * persistent member identity. The implementation is governed by the
 * communitybbs_member data model, which enforces strict requirements: the email
 * field must be unique and contain a valid email format; the password_hash is
 * securely stored using BCrypt encryption; and the display_name is mandatory,
 * defaulting to "Anonymous" if not provided. The operation creates a new record
 * in the communitybbs_member table with the submitted credentials,
 * automatically generating a unique UUID for the id field. Concurrently, a
 * corresponding session record is initiated in the communitybbs_session table
 * with a cryptographically secure token, an expiration timestamp, and an active
 * status marked as true. The operation references no fields beyond those
 * defined in the communitybbs_member schema, meaning it does not rely on or
 * update any denormalized fields such as last_active_at or updated_at, as those
 * are handled by the application layer following successful creation. This flow
 * integrates directly with the platform's authentication workflow, where a
 * successful join operation immediately provides access to all member-only
 * functionalities including posting, commenting, voting, and community joining.
 * The operation does not support password recovery or token refresh; those are
 * separate concerns handled by their own dedicated endpoints. Security
 * considerations include ensuring password hashes are never transmitted in
 * plaintext and that validation is performed strictly server-side. The
 * operation is stateless and idempotent, meaning repeated execution with
 * identical credentials will fail due to the unique email constraint. A
 * successful response will include the newly generated member's email and
 * display_name in the response body, formatted as
 * ICommunitybbsMember.IAuthorized, following the required DTO naming pattern
 * for authentication operations. This operation is the only authorized path for
 * a guest to transition into a member, and all other user interactions are
 * blocked until this step is successfully completed.
 *
 * @param props - Request properties
 * @param props.guest - The authenticated guest making the request (required for
 *   context)
 * @param props.body - Request body containing email and display_name for new
 *   member registration
 * @returns Authentication token and member ID upon successful registration
 * @throws {Error} When email already exists (Prisma constraint violation)
 */
export async function postauthGuestJoin(props: {
  guest: GuestPayload;
  body: ICommunitybbsMember.ICreate;
}): Promise<ICommunitybbsMember.IAuthorized> {
  const { body } = props;

  // Hash password securely using MyGlobal.password
  const hashedPassword = await MyGlobal.password.hash(body.password);

  // Generate UUID for new member
  const id = v4() as string & tags.Format<"uuid">;

  // Generate current ISO timestamp for created_at and updated_at
  const now = toISOStringSafe(new Date());

  // Create member record in database
  const created = await MyGlobal.prisma.communitybbs_member.create({
    data: {
      id,
      email: body.email,
      password_hash: hashedPassword,
      display_name: body.display_name,
      created_at: now,
      updated_at: now,
    },
  });

  // Generate JWT access token and refresh token
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

  // Return authorized response with tokens and member ID
  return {
    id: created.id,
    token: {
      access: accessToken,
      refresh: refreshToken,
      expired_at: toISOStringSafe(new Date(Date.now() + 1 * 60 * 60 * 1000)),
      refreshable_until: toISOStringSafe(
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ),
    },
  };
}
