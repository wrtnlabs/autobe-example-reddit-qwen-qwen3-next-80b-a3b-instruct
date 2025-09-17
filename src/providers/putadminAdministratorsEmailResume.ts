import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ICommunitybbsAdministrator } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsAdministrator";
import { AdministratorPayload } from "../decorators/payload/AdministratorPayload";

export async function putadminAdministratorsEmailResume(props: {
  administrator: AdministratorPayload;
  email: string & tags.Format<"email">;
}): Promise<ICommunitybbsAdministrator> {
  const { administrator, email } = props;

  // Find target administrator by email
  const targetAdministrator =
    await MyGlobal.prisma.communitybbs_administrator.findUnique({
      where: { email },
    });

  if (!targetAdministrator) {
    throw new Error("Target administrator not found");
  }

  // Find all sessions associated with target administrator that are suspended (deleted_at is not null)
  // Note: Cannot use deleted_at in where clause due to Prisma schema limitation in WhereInput type
  const suspendedSessions = await MyGlobal.prisma.communitybbs_session.findMany(
    {
      where: { actor_id: targetAdministrator.id },
    },
  );

  // Filter to only suspended sessions (deleted_at is not null)
  const toResume = suspendedSessions.filter(
    (session) => session.deleted_at !== null,
  );

  if (toResume.length === 0) {
    // No suspended sessions to resume
    // Still return current admin state
    return {
      id: targetAdministrator.id,
      email: targetAdministrator.email,
      display_name: targetAdministrator.display_name,
      created_at: toISOStringSafe(targetAdministrator.created_at),
      updated_at: toISOStringSafe(targetAdministrator.updated_at),
    };
  }

  // Update all suspended sessions to reactivate them
  await Promise.all(
    toResume.map((session) =>
      MyGlobal.prisma.communitybbs_session.update({
        where: { id: session.id },
        data: {
          is_valid: true,
          deleted_at: null,
        },
      }),
    ),
  );

  // Create log entry
  await MyGlobal.prisma.communitybbs_log.create({
    data: {
      id: v4() as string & tags.Format<"uuid">,
      actor_id: administrator.id,
      target_id: targetAdministrator.id,
      action_type: "administrator_resumed",
      details: JSON.stringify({
        target_email: email,
        sessions_resumed: toResume.length,
      }),
      created_at: toISOStringSafe(new Date()),
      ip_address: administrator.ip_address || null, // Assuming administrator payload might have IP
    },
  });

  // Return updated administrator record
  return {
    id: targetAdministrator.id,
    email: targetAdministrator.email,
    display_name: targetAdministrator.display_name,
    created_at: toISOStringSafe(targetAdministrator.created_at),
    updated_at: toISOStringSafe(targetAdministrator.updated_at),
  };
}
