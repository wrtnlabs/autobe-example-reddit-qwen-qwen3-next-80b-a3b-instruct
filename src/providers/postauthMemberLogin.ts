import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IMember";
import { ICommunitybbsMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsMember";

export async function postauthMemberLogin(props: {
  email: string & tags.Format<"email">;
  password: string;
  body: IMember.ILogin;
}): Promise<ICommunitybbsMember.IAuthorized> {
  const { email, password } = props;

  // Find the member by email
  const member = await MyGlobal.prisma.communitybbs_member.findUniqueOrThrow({
    where: { email },
  });

  // Verify password
  const isValid = await MyGlobal.password.verify(
    password,
    member.password_hash,
  );
  if (!isValid) {
    throw new Error("Login failed. Please try again.");
  }

  // Generate session token
  const sessionId = v4() as string & tags.Format<"uuid">;
  const now = toISOStringSafe(new Date());
  const expiresAt = toISOStringSafe(new Date(Date.now() + 60 * 60 * 1000)); // 1 hour
  const refreshUntil = toISOStringSafe(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  ); // 7 days

  // Create session record
  await MyGlobal.prisma.communitybbs_session.create({
    data: {
      id: sessionId,
      actor_id: member.id,
      token: sessionId, // Using session ID as token for simplicity
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
      userId: member.id,
      email: member.email,
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
      userId: member.id,
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
    id: member.id,
    token: {
      access: accessToken,
      refresh: refreshToken,
      expired_at: expiresAt,
      refreshable_until: refreshUntil,
    },
  };
}
