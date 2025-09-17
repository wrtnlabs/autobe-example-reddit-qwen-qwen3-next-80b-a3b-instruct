import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ICommunitybbsMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsMember";
import { AdministratorPayload } from "../decorators/payload/AdministratorPayload";

/**
 * View member account details (Admin only)
 *
 * This endpoint allows administrators to view detailed information about a
 * registered member account stored in the communitybbs_member table.
 *
 * The system looks up the member by email provided in the request. It returns
 * the following fields: id, email, display_name, created_at, updated_at. The
 * password_hash is never returned. This information is used for moderation
 * purposes such as reviewing account activity, verifying identity, or
 * diagnosing reports.
 *
 * The operation includes a timestamp of the member's last active session by
 * joining with the communitybbs_session table (most recent session where
 * is_valid = true). This provides context on whether the member is active or
 * dormant.
 *
 * No post, comment, or vote history is included in the response to preserve
 * privacy and limit data exposure. The endpoint is read-only and does not
 * modify any data.
 *
 * This endpoint supports only administrative access and is not available to
 * regular members. This ensures that privacy is maintained while enabling
 * moderation workflows.
 *
 * @param props - Request properties
 * @param props.administrator - The authenticated administrator making the
 *   request
 * @param props.email - The email address of the member to inspect
 * @returns Comprehensive but privacy-safe details of the member account,
 *   including last active session timestamp
 * @throws {Error} When member with specified email is not found
 */
export async function getadminMembersEmail(props: {
  administrator: AdministratorPayload;
  email: string & tags.Format<"email">;
}): Promise<
  ICommunitybbsMember & {
    last_active_at: (string & tags.Format<"date-time">) | null;
  }
> {
  const { email } = props;

  // Find member by email and include their most recent active session
  const memberWithSession = await MyGlobal.prisma.communitybbs_member.findFirst(
    {
      where: {
        email: email,
      },
      include: {
        communitybbs_session: {
          where: {
            is_valid: true,
          },
          orderBy: {
            created_at: "desc",
          },
          take: 1,
        },
      },
    },
  );

  // If member not found, throw error
  if (!memberWithSession) {
    throw new Error("Member not found");
  }

  // Extract last active session timestamp if exists, otherwise null
  const lastActiveSession = memberWithSession.communitybbs_session[0];
  const last_active_at = lastActiveSession
    ? toISOStringSafe(lastActiveSession.last_activity_at)
    : null;

  // Return object matching ICommunitybbsMember + last_active_at
  return {
    id: memberWithSession.id,
    email: memberWithSession.email,
    display_name: memberWithSession.display_name,
    created_at: toISOStringSafe(memberWithSession.created_at),
    updated_at: toISOStringSafe(memberWithSession.updated_at),
    last_active_at,
  };
}
