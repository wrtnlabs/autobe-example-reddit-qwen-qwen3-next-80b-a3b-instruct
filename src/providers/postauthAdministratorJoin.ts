import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ICommunitybbsAdministrator } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsAdministrator";
import { AdministratorPayload } from "../decorators/payload/AdministratorPayload";

export async function postauthAdministratorJoin(props: {
  administrator: AdministratorPayload;
  email: string & tags.Format<"email">;
  password: string;
  displayName: string;
}): Promise<ICommunitybbsAdministrator.IAuthorized> {
  const { administrator, email, password, displayName } = props;

  // Validate password length
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters long");
  }

  // Validate display name length
  if (displayName.length < 1 || displayName.length > 32) {
    throw new Error("Display name must be between 1 and 32 characters");
  }

  // Verify administrator (authorizing user) is valid and active
  const authAdmin = await MyGlobal.prisma.communitybbs_administrator.findFirst({
    where: { id: administrator.id },
  });

  if (!authAdmin) {
    throw new Error("Unauthorized: Authorizing administrator not found");
  }

  if (authAdmin.deleted_at !== null) {
    throw new Error("Unauthorized: Authorizing administrator is deactivated");
  }

  // Hash password using MyGlobal.password.hash()
  const hashedPassword = await MyGlobal.password.hash(password);

  // Generate new admin id
  const adminId = v4() as string & tags.Format<"uuid">;

  // Generate timestamps
  const now = toISOStringSafe(new Date());
  const expiresAt = toISOStringSafe(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  ); // 30 days

  // Create session first
  const sessionToken = v4();

  const session = await MyGlobal.prisma.communitybbs_session.create({
    data: {
      actor_id: adminId,
      token: sessionToken,
      expires_at: expiresAt,
      last_activity_at: now,
      created_at: now,
      updated_at: now,
      is_valid: true,
    },
  });

  // Create new administrator record with session_id
  const createdAdmin = await MyGlobal.prisma.communitybbs_administrator.create({
    data: {
      id: adminId,
      email,
      password_hash: hashedPassword,
      display_name: displayName,
      created_at: now,
      updated_at: now,
      session_id: session.id,
    },
  });

  // Generate JWT token with exact payload structure matching AdministratorPayload
  const accessToken = jwt.sign(
    {
      id: adminId,
      type: "administrator",
    },
    MyGlobal.env.JWT_SECRET_KEY,
    {
      expiresIn: "1h",
      issuer: "autobe",
    },
  );

  const refreshToken = jwt.sign(
    {
      id: adminId,
      tokenType: "refresh",
    },
    MyGlobal.env.JWT_SECRET_KEY,
    {
      expiresIn: "7d",
      issuer: "autobe",
    },
  );

  return {
    id: adminId,
    token: {
      access: accessToken,
      refresh: refreshToken,
      expired_at: toISOStringSafe(new Date(Date.now() + 60 * 60 * 1000)), // 1 hour from now
      refreshable_until: toISOStringSafe(
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ), // 7 days from now
    },
  };
}
