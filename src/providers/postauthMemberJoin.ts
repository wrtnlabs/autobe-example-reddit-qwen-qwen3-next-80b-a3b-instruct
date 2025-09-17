import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IMember";
import { ICommunitybbsMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsMember";

export async function postauthMemberJoin(props: {
  email: string & tags.Format<"email">;
  password: string;
  displayName: string;
  body: IMember.ICreate;
}): Promise<ICommunitybbsMember.IAuthorized> {
  // Extract and validate parameters from props
  const { email, password, displayName, body } = props;

  // Use the body for consistency with DTO, prefer body.display_name over displayName
  const display_name =
    body.display_name ?? (displayName ? displayName : undefined);

  // Generate a new UUID for the member
  const id: string & tags.Format<"uuid"> = v4();

  // Hash the password using MyGlobal.password.hash
  const hashed_password = await MyGlobal.password.hash(password);

  // Get current timestamp as ISO string
  const now: string & tags.Format<"date-time"> = toISOStringSafe(new Date());

  // Create the new member record in the database
  const createdMember = await MyGlobal.prisma.communitybbs_member.create({
    data: {
      id,
      email,
      password_hash: hashed_password,
      display_name: display_name ?? undefined, // Use undefined for optional field
      created_at: now,
      updated_at: now,
    },
  });

  // Generate a session token for the new user
  const sessionToken = v4();
  const expiresAt: string & tags.Format<"date-time"> = toISOStringSafe(
    new Date(Date.now() + 1 * 60 * 60 * 1000),
  ); // 1 hour
  const refreshExpiresAt: string & tags.Format<"date-time"> = toISOStringSafe(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  ); // 7 days

  // Create the session record in the database
  await MyGlobal.prisma.communitybbs_session.create({
    data: {
      id: v4(),
      actor_id: createdMember.id,
      token: sessionToken,
      expires_at: expiresAt,
      last_activity_at: now,
      created_at: now,
      updated_at: now,
      is_valid: true,
    },
  });

  // Generate JWT tokens
  const accessToken = jwt.sign(
    {
      userId: createdMember.id,
    },
    MyGlobal.env.JWT_SECRET_KEY,
    {
      expiresIn: "1h",
      issuer: "autobe",
    },
  );

  const refreshToken = jwt.sign(
    {
      userId: createdMember.id,
      tokenType: "refresh",
    },
    MyGlobal.env.JWT_SECRET_KEY,
    {
      expiresIn: "7d",
      issuer: "autobe",
    },
  );

  // Return the authorized response
  return {
    id: createdMember.id,
    token: {
      access: accessToken,
      refresh: refreshToken,
      expired_at: expiresAt,
      refreshable_until: refreshExpiresAt,
    },
  };
}
