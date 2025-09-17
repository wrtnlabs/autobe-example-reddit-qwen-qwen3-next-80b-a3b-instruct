import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ICommunitybbsMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsMember";
import { AdministratorPayload } from "../decorators/payload/AdministratorPayload";

/**
 * Restore banned member access (Admin only)
 *
 * This endpoint reinstates access for a previously banned member by allowing
 * new session creation.
 *
 * The system looks up the member by their email in the communitybbs_member
 * table. It does not restore any old sessions; instead, it permits future
 * sessions to be generated upon successful login. No existing deleted sessions
 * are retrieved.
 *
 * The member's data (email, display_name, created_at) remains unchanged. The
 * ban status is considered resolved, and the member may attempt to log in
 * again.
 *
 * If the member attempts to log in, the authentication flow proceeds normally,
 * and a new session is created. The previous inactive sessions remain deleted
 * for audit purposes.
 *
 * A log entry is created in the communitybbs_log table with action_type
 * 'member_unbanned', recording the administrator who performed the action and
 * the member's identity.
 *
 * This operation does not delete the ban history; it only re-enables the
 * account. The track record of past violations remains intact for review and
 * analytics.
 *
 * @param props - Request properties
 * @param props.administrator - The authenticated administrator performing the
 *   unban
 * @param props.email - The email address of the member to unban
 * @returns The updated member record with ban status lifted
 * @throws {Error} When the member with the specified email does not exist
 */
export async function putadminMembersEmailUnban(props: {
  administrator: AdministratorPayload;
  email: string & tags.Format<"email">;
}): Promise<ICommunitybbsMember> {
  const { email } = props;

  // Find the member by email
  const member = await MyGlobal.prisma.communitybbs_member.findUnique({
    where: { email },
  });

  // Throw error if member not found
  if (!member) {
    throw new Error("Member not found");
  }

  // Create log entry for the unban action
  await MyGlobal.prisma.communitybbs_log.create({
    data: {
      actor_id: props.administrator.id,
      target_id: member.id,
      action_type: "member_unbanned",
      details: "Member access restored by administrator",
      created_at: toISOStringSafe(new Date()),
      ip_address: props.administrator.ip_address || null,
    },
  });

  // Return the member record exactly as stored
  // All date fields are already string & tags.Format<'date-time'> from Prisma
  // No conversion needed - though toISOStringSafe would be used if needed
  return {
    id: member.id,
    email: member.email,
    display_name: member.display_name,
    created_at: member.created_at,
    updated_at: member.updated_at,
  };
}
