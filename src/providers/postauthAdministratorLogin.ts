import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ICommunitybbsAdministrator } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsAdministrator";
import { AdministratorPayload } from "../decorators/payload/AdministratorPayload";

export async function postauthAdministratorLogin(props: {
  administrator: AdministratorPayload;
  email: string & tags.Format<"email">;
  password: string;
}): Promise<ICommunitybbsAdministrator.IAuthorized> {
  const { email, password } = props;

  // Fetch the administrator by email
  const administrator =
    await MyGlobal.prisma.communitybbs_administrator.findFirst({
      where: { email },
    });

  if (!administrator) {
    throw new Error("Invalid credentials");
  }

  // Verify password
  const isValid = await MyGlobal.password.verify(
    password,
    administrator.password_hash,
  );

  if (!isValid) {
    throw new Error("Invalid credentials");
  }

  // Generate new session token
  const sessionToken = v4() as string & tags.Format<"uuid">;

  // Create new session
  await MyGlobal.prisma.communitybbs_session.create({
    data: {
      actor_id: administrator.id,
      token: sessionToken,
      expires_at: toISOStringSafe(new Date(Date.now() + 3600000)), // 1 hour
      last_activity_at: toISOStringSafe(new Date()),
      created_at: toISOStringSafe(new Date()),
      updated_at: toISOStringSafe(new Date()),
      is_valid: true,
    },
  });

  // Generate JWT access token
  const accessToken = jwt.sign(
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

  // Generate JWT refresh token
  const refreshToken = jwt.sign(
    {
      userId: administrator.id,
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
    id: administrator.id,
    token: {
      access: accessToken,
      refresh: refreshToken,
      expired_at: toISOStringSafe(new Date(Date.now() + 3600000)),
      refreshable_until: toISOStringSafe(new Date(Date.now() + 604800000)), // 7 days
    },
  };
}
