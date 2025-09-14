import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IResponseEmpty } from "@ORGANIZATION/PROJECT-api/lib/structures/IResponseEmpty";
import { AdministratorPayload } from "../decorators/payload/AdministratorPayload";

export async function deleteadminMembersEmail(props: {
  administrator: AdministratorPayload;
  email: string & tags.Format<"email">;
}): Promise<IResponseEmpty> {
  const { administrator, email } = props;

  // Find the member by email
  const member = await MyGlobal.prisma.communitybbs_member.findFirst({
    where: { email },
  });

  if (!member) {
    throw new Error("Member not found");
  }

  // Perform cascading delete: sessions, votes, comments, posts, member
  await MyGlobal.prisma.communitybbs_session.deleteMany({
    where: { actor_id: member.id },
  });

  await MyGlobal.prisma.communitybbs_vote.deleteMany({
    where: { actor_id: member.id },
  });

  await MyGlobal.prisma.communitybbs_comment.deleteMany({
    where: { communitybbs_member_id: member.id },
  });

  await MyGlobal.prisma.communitybbs_post.deleteMany({
    where: { communitybbs_member_id: member.id },
  });

  await MyGlobal.prisma.communitybbs_member.delete({
    where: { id: member.id },
  });

  // Log the action
  await MyGlobal.prisma.communitybbs_log.create({
    data: {
      actor_id: administrator.id,
      target_id: member.id,
      action_type: "member_permanently_deleted",
      details: JSON.stringify({ email }),
      created_at: toISOStringSafe(new Date()),
      ip_address: null,
    },
  });

  return {};
}
