import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ICommunitybbsMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsMember";
import { AdministratorPayload } from "../decorators/payload/AdministratorPayload";

export async function putadminMembersEmailUnban(props: {
  administrator: AdministratorPayload;
  email: string & tags.Format<"email">;
}): Promise<ICommunitybbsMember> {
  const { administrator, email } = props;

  // Find member by email
  const member = await MyGlobal.prisma.communitybbs_member.findFirst({
    where: { email },
  });

  // If member not found, throw error
  if (!member) {
    throw new Error("Member not found");
  }

  // Create log entry for unban action
  const now = toISOStringSafe(new Date());
  await MyGlobal.prisma.communitybbs_log.create({
    data: {
      actor_id: administrator.id,
      target_id: member.id,
      action_type: "member_unbanned",
      details: JSON.stringify({ email }),
      created_at: now,
      ip_address: null,
    },
  });

  // Return member object with proper type and ISO date strings
  return {
    id: member.id,
    email: member.email,
    display_name: member.display_name,
    created_at: toISOStringSafe(member.created_at),
    updated_at: toISOStringSafe(member.updated_at),
  };
}
