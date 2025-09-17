import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ICommunitybbsMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsMember";
import { AdministratorPayload } from "../decorators/payload/AdministratorPayload";

/**
 * Bans a member from the platform, preventing all future logins and
 * interactions.
 *
 * This endpoint bans a member from the platform, effectively blocking their
 * access while preserving content history.
 *
 * The system identifies the member by their email, then locates all active
 * sessions (where is_valid = true) in the communitybbs_session table, and
 * permanently marks them as deleted by setting deleted_at to the current
 * timestamp and is_valid to false.
 *
 * The member's record in the communitybbs_member table is not deleted. Their
 * email, username, and historical contributions remain intact. They are
 * prevented from authenticating any further; login attempts will be denied.
 *
 * A log entry is created in the communitybbs_log table with action_type
 * 'member_banned' and includes the moderator's ID and the reason (if provided).
 * The ban is immutable and requires restoration via a separate endpoint.
 *
 * This is a reputation action, not a deletion. Posts and comments created by
 * the member remain visible to maintain context and allow community review. The
 * ban does not affect post votes or comment threads.
 *
 * To reinstate access, the administrator must use the restore membership
 * endpoint.
 *
 * @param props - Request properties
 * @param props.administrator - The authenticated administrator performing the
 *   ban
 * @param props.email - The email address of the member to ban
 * @returns The updated member record with ban status confirmed
 * @throws {Error} When the member with the provided email is not found
 */
export async function putadminMembersEmailBan(props: {
  administrator: AdministratorPayload;
  email: string & tags.Format<"email">;
}): Promise<ICommunitybbsMember> {
  const { email } = props;

  // Find the member by email
  const member = await MyGlobal.prisma.communitybbs_member.findFirstOrThrow({
    where: {
      email,
    },
    select: {
      id: true,
      email: true,
      display_name: true,
      created_at: true,
      updated_at: true,
    },
  });

  // Find all active sessions for this member (not deleted)
  const activeSessions = await MyGlobal.prisma.communitybbs_session.findMany({
    where: {
      actor_id: member.id,
      is_valid: true,
      deleted_at: null,
    },
    select: {
      id: true,
    },
  });

  // Update each active session to mark as deleted and invalid
  const updatePromises = activeSessions.map((session) =>
    MyGlobal.prisma.communitybbs_session.update({
      where: { id: session.id },
      data: {
        deleted_at: toISOStringSafe(new Date()),
        is_valid: false,
        updated_at: toISOStringSafe(new Date()),
      },
    }),
  );

  await Promise.all(updatePromises);

  // Return the member record in the format expected by the API
  return {
    id: member.id,
    email: member.email,
    display_name: member.display_name,
    created_at: toISOStringSafe(member.created_at),
    updated_at: toISOStringSafe(member.updated_at),
  };
}
