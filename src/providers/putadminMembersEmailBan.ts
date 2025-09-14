import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ICommunitybbsMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsMember";
import { AdministratorPayload } from "../decorators/payload/AdministratorPayload";

export async function putadminMembersEmailBan(props: {
  administrator: AdministratorPayload;
  email: string & tags.Format<"email">;
}): Promise<ICommunitybbsMember> {
  const { email } = props;

  const member = await MyGlobal.prisma.communitybbs_member.findUniqueOrThrow({
    where: { email },
  });

  const now = toISOStringSafe(new Date());

  await MyGlobal.prisma.communitybbs_session.updateMany({
    where: {
      actor_id: member.id,
      is_valid: true,
    },
    data: {
      deleted_at: now,
      is_valid: false,
    },
  });

  return {
    id: member.id,
    email: member.email,
    display_name: member.display_name,
    created_at: toISOStringSafe(member.created_at),
    updated_at: toISOStringSafe(member.updated_at),
  };
}
