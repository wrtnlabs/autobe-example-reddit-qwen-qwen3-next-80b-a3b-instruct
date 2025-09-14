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
  const { email, password, displayName } = props;

  const id = v4() as string & tags.Format<"uuid">;
  const hashedPassword = await MyGlobal.password.hash(password);

  const computedDisplayName =
    displayName !== undefined ? displayName : email.split("@")[0];
  const now = toISOStringSafe(new Date());

  const created = await MyGlobal.prisma.communitybbs_member.create({
    data: {
      id,
      email,
      password_hash: hashedPassword,
      display_name: computedDisplayName,
      created_at: now,
      updated_at: now,
    },
  });

  const token = v4() as string;
  const expiresAt = toISOStringSafe(new Date(Date.now() + 1000 * 60 * 60));
  const refreshableUntil = toISOStringSafe(
    new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
  );

  const session = await MyGlobal.prisma.communitybbs_session.create({
    data: {
      actor_id: created.id,
      token,
      expires_at: expiresAt,
      last_activity_at: expiresAt,
      created_at: now,
      updated_at: now,
      is_valid: true,
    },
  });

  const accessToken = jwt.sign(
    { userId: created.id, email },
    MyGlobal.env.JWT_SECRET_KEY,
    { expiresIn: "1h", issuer: "autobe" },
  );

  const refreshToken = jwt.sign(
    { userId: created.id, tokenType: "refresh" },
    MyGlobal.env.JWT_SECRET_KEY,
    { expiresIn: "7d", issuer: "autobe" },
  );

  return {
    id: created.id,
    token: {
      access: accessToken,
      refresh: refreshToken,
      expired_at: expiresAt,
      refreshable_until: refreshableUntil,
    },
  };
}
