import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ICommunitybbsAdministrator } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsAdministrator";
import { AdministratorPayload } from "../decorators/payload/AdministratorPayload";

export async function putadminAdministratorsEmailSuspend(props: {
  administrator: AdministratorPayload;
  email: string & tags.Format<"email">;
}): Promise<ICommunitybbsAdministrator> {
  const { administrator, email } = props;

  // Find the administrator by email
  const adminRecord =
    await MyGlobal.prisma.communitybbs_administrator.findFirst({
      where: {
        email,
      },
    });

  if (!adminRecord) {
    throw new Error("Administrator not found");
  }

  // Find all active sessions for this administrator
  const activeSessions = await MyGlobal.prisma.communitybbs_session.findMany({
    where: {
      actor_id: adminRecord.id,
      is_valid: true,
      deleted_at: null,
    },
  });

  // Update each active session to invalidate it
  for (const session of activeSessions) {
    await MyGlobal.prisma.communitybbs_session.update({
      where: {
        id: session.id,
      },
      data: {
        is_valid: false,
        deleted_at: toISOStringSafe(new Date()),
      },
    });
  }

  // Create a log entry for the suspension
  await MyGlobal.prisma.communitybbs_log.create({
    data: {
      actor_id: administrator.id,
      target_id: adminRecord.id,
      action_type: "administrator_suspended",
      details: JSON.stringify({
        email: email,
        suspended_by_admin_id: administrator.id,
      }),
      created_at: toISOStringSafe(new Date()),
      ip_address: null,
    },
  });

  // Return the administrator record (unchanged except for session invalidation)
  return {
    id: adminRecord.id,
    email: adminRecord.email,
    display_name: adminRecord.display_name,
    created_at: toISOStringSafe(adminRecord.created_at),
    updated_at: toISOStringSafe(adminRecord.updated_at),
  };
}
