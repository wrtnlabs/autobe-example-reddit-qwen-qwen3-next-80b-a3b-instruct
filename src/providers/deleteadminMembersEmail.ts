import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IResponseEmpty } from "@ORGANIZATION/PROJECT-api/lib/structures/IResponseEmpty";
import { AdministratorPayload } from "../decorators/payload/AdministratorPayload";

/**
 * Permanently delete a member and all their content (Admin only)
 *
 * This endpoint permanently deletes a member's account and all their
 * contributions, removing their data entirely from the system.
 *
 * The system identifies the member by email, then begins a cascading delete
 * process: all sessions in communitybbs_session (where actor_id matches), all
 * votes in communitybbs_vote (where actor_id matches), all comments in
 * communitybbs_comment (where communitybbs_member_id matches), all posts in
 * communitybbs_post (where communitybbs_member_id matches), and finally the
 * member record itself in communitybbs_member.
 *
 * The deletion is atomic, ensuring no orphaned data remains. A hard delete is
 * performed — the data is completely removed from the database.
 *
 * A detailed log entry is created in the communitybbs_log table with
 * action_type 'member_permanently_deleted', including the operator's identity
 * and the email of the deleted member.
 *
 * This operation is irreversible and the member's email may be reused. It is
 * intended only for legal compliance (GDPR, CCPA), severe abuse that requires
 * censorship, or formal user requests for complete removal. Use with extreme
 * caution.
 *
 * @param props - Request properties
 * @param props.administrator - The authenticated administrator performing the
 *   deletion
 * @param props.email - The email address of the member to delete permanently
 * @returns Confirms successful deletion with no response body
 * @throws {Error} When member with given email does not exist
 * @throws {Error} When deletion fails due to database error
 */
export async function deleteadminMembersEmail(props: {
  administrator: AdministratorPayload;
  email: string & tags.Format<"email">;
}): Promise<IResponseEmpty> {
  const { administrator, email } = props;

  // Start transaction for atomic deletion
  const result = await MyGlobal.prisma.$transaction(async (prisma) => {
    // Find member by email
    const member = await prisma.communitybbs_member.findUnique({
      where: { email },
    });

    if (!member) {
      throw new Error(`Member with email ${email} does not exist`);
    }

    // Get current timestamp for log and cleanup
    const now: string & tags.Format<"date-time"> = toISOStringSafe(new Date());

    // Delete all sessions associated with this member
    await prisma.communitybbs_session.deleteMany({
      where: { actor_id: member.id },
    });

    // Delete all votes associated with this member
    await prisma.communitybbs_vote.deleteMany({
      where: { actor_id: member.id },
    });

    // Delete all comments associated with this member
    await prisma.communitybbs_comment.deleteMany({
      where: { communitybbs_member_id: member.id },
    });

    // Delete all posts associated with this member
    await prisma.communitybbs_post.deleteMany({
      where: { communitybbs_member_id: member.id },
    });

    // Delete the member record itself
    await prisma.communitybbs_member.delete({
      where: { id: member.id },
    });

    // Create log entry for audit trail
    await prisma.communitybbs_log.create({
      data: {
        id: v4() as string & tags.Format<"uuid">,
        actor_id: administrator.id,
        target_id: member.id,
        action_type: "member_permanently_deleted",
        details: JSON.stringify({ email }),
        created_at: now,
        ip_address: null,
      },
    });

    return {};
  });

  return result;
}
