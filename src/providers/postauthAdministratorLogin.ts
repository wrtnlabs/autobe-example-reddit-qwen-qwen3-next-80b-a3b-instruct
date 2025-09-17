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

  // Find administrator by email
  const admin = await MyGlobal.prisma.communitybbs_administrator.findFirst({
    where: {
      email,
    },
  });

  // Validate administrator exists
  if (!admin) {
    throw new Error("Invalid credentials");
  }

  // Verify password
  const isValid = await MyGlobal.password.verify(password, admin.password_hash);
  if (!isValid) {
    throw new Error("Invalid credentials");
  }

  // Generate session token with expiration
  const now = new Date();
  const accessExpires = new Date(now.getTime() + 3600000); // 1 hour
  const refreshExpires = new Date(now.getTime() + 604800000); // 7 days

  const access = jwt.sign(
    {
      id: admin.id,
      type: "administrator" as const,
    },
    MyGlobal.env.JWT_SECRET_KEY,
    {
      expiresIn: "1h",
      issuer: "autobe",
    },
  );

  const refresh = jwt.sign(
    {
      id: admin.id,
      tokenType: "refresh",
    },
    MyGlobal.env.JWT_SECRET_KEY,
    {
      expiresIn: "7d",
      issuer: "autobe",
    },
  );

  // Create session record
  await MyGlobal.prisma.communitybbs_session.create({
    data: {
      actor_id: admin.id,
      token: access,
      expires_at: toISOStringSafe(accessExpires),
      last_activity_at: toISOStringSafe(now),
      created_at: toISOStringSafe(now),
      updated_at: toISOStringSafe(now),
      is_valid: true,
    },
  });

  return {
    id: admin.id,
    token: {
      access,
      refresh,
      expired_at: toISOStringSafe(accessExpires),
      refreshable_until: toISOStringSafe(refreshExpires),
    },
  };
}
