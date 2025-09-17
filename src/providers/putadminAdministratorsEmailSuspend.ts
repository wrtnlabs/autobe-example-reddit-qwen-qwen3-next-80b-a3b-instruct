import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ICommunitybbsAdministrator } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsAdministrator";
import { AdministratorPayload } from "../decorators/payload/AdministratorPayload";

/**
 * Suspends administrator access by revoking all active sessions.
 *
 * This operation invalidates all active sessions associated with the
 * administrator by setting is_valid to false and recording a deletion
 * timestamp. The administrator record itself remains intact to preserve audit
 * history. Future login attempts will be rejected due to invalidated sessions.
 *
 * A system log entry is generated to audit the suspension event.
 *
 * @param props - Request properties
 * @param props.administrator - The administrative user performing the
 *   suspension
 * @param props.email - The email address of the administrator to suspend
 * @returns The administrator record with current identity information
 * @throws {Error} When the administrator with the given email does not exist
 */
export async function putadminAdministratorsEmailSuspend(props: {
  administrator: { id: string & tags.Format<"uuid"> };
  email: string & tags.Format<"email">;
}): Promise<ICommunitybbsAdministrator> {
  const { email } = props;

  // Validate administrator exists
  const administrator =
    await MyGlobal.prisma.communitybbs_administrator.findFirst({
      where: { email },
    });

  if (!administrator) {
    throw new Error("Administrator not found");
  }

  // Get current timestamp for all operations
  const now = toISOStringSafe(new Date());

  // Find all active sessions linked to this administrator
  const activeSessions = await MyGlobal.prisma.communitybbs_session.findMany({
    where: {
      actor_id: administrator.id,
      is_valid: true,
      deleted_at: null,
    },
  });

  // Inactivate each active session
  await Promise.all(
    activeSessions.map((session) =>
      MyGlobal.prisma.communitybbs_session.update({
        where: { id: session.id },
        data: {
          is_valid: false,
          deleted_at: now,
        },
      }),
    ),
  );

  // Create system log entry
  await MyGlobal.prisma.communitybbs_log.create({
    data: {
      id: v4() as string & tags.Format<"uuid">,
      actor_id: props.administrator.id,
      target_id: administrator.id,
      action_type: "administrator_suspended",
      details: JSON.stringify({
        suspended_email: email,
      }),
      created_at: now,
      ip_address: "", // Not tracked here, could be extracted from request context in production
    },
  });

  // Return cleaned administrator record matching ICommunitybbsAdministrator
  return {
    id: administrator.id,
    email: administrator.email,
    display_name: administrator.display_name,
    created_at: toISOStringSafe(administrator.created_at),
    updated_at: toISOStringSafe(administrator.updated_at),
  };
}
