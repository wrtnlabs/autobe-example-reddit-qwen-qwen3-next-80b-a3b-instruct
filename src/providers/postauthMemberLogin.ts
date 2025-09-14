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

  const member = await MyGlobal.prisma.communitybbs_member.findUniqueOrThrow({
    where: { email },
  });

  const isValid = await MyGlobal.password.verify(
    password,
    member.password_hash,
  );

  if (!isValid) {
    throw new Error("Login failed. Please try again.");
  }

  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const accessToken = jwt.sign(
    {
      userId: member.id,
      email: member.email,
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

  const sessionId = v4() as string & tags.Format<"uuid">;

  await MyGlobal.prisma.communitybbs_session.create({
    data: {
      id: sessionId,
      actor_id: member.id,
      token: accessToken,
      expires_at: toISOStringSafe(oneHourFromNow),
      last_activity_at: toISOStringSafe(now),
      created_at: toISOStringSafe(now),
      updated_at: toISOStringSafe(now),
      is_valid: true,
    },
  });

  return {
    id: member.id,
    token: {
      access: accessToken,
      refresh: refreshToken,
      expired_at: toISOStringSafe(oneHourFromNow),
      refreshable_until: toISOStringSafe(sevenDaysFromNow),
    },
  };
}
