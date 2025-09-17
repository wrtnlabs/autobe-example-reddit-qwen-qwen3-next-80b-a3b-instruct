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
  const now = toISOStringSafe(new Date());
  const expiresAt = toISOStringSafe(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  );

  const hashedPassword = await MyGlobal.password.hash(props.password);

  const administrator = await MyGlobal.prisma.communitybbs_administrator.create(
    {
      data: {
        id: v4() as string & tags.Format<"uuid">,
        email: props.email,
        password_hash: hashedPassword,
        display_name: props.displayName,
        created_at: now,
        updated_at: now,
      },
    },
  );

  const sessionToken = v4();

  await MyGlobal.prisma.communitybbs_session.create({
    data: {
      id: v4() as string & tags.Format<"uuid">,
      actor_id: administrator.id,
      token: sessionToken,
      expires_at: expiresAt,
      last_activity_at: now,
      created_at: now,
      updated_at: now,
      is_valid: true,
    },
  });

  const accessToken = jwt.sign(
    {
      userId: administrator.id,
      email: administrator.email,
      type: "administrator",
    },
    MyGlobal.env.JWT_SECRET_KEY,
    {
      expiresIn: "30d",
      issuer: "autobe",
    },
  );

  const refreshToken = jwt.sign(
    {
      userId: administrator.id,
      tokenType: "refresh",
    },
    MyGlobal.env.JWT_SECRET_KEY,
    {
      expiresIn: "30d",
      issuer: "autobe",
    },
  );

  return {
    id: administrator.id,
    token: {
      access: accessToken,
      refresh: refreshToken,
      expired_at: expiresAt,
      refreshable_until: expiresAt,
    },
  };
}
