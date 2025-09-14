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

  // Find the target administrator by email
  const targetAdmin =
    await MyGlobal.prisma.communitybbs_administrator.findFirstOrThrow({
      where: { email },
    });

  // Find all sessions for this admin that are suspended (deleted_at is not null)
  const suspendedSessions = await MyGlobal.prisma.communitybbs_session.findMany(
    {
      where: {
        actor_id: targetAdmin.id,
        deleted_at: { not: null },
      },
    },
  );

  // If there are suspended sessions, update them in batch
  if (suspendedSessions.length > 0) {
    await MyGlobal.prisma.communitybbs_session.updateMany({
      where: {
        id: { in: suspendedSessions.map((s) => s.id) },
      },
      data: {
        is_valid: true,
        deleted_at: null,
      },
    });
  }

  // Return the administrator record with properly converted date fields
  return {
    id: targetAdmin.id,
    email: targetAdmin.email,
    display_name: targetAdmin.display_name,
    created_at: toISOStringSafe(targetAdmin.created_at),
    updated_at: toISOStringSafe(targetAdmin.updated_at),
  } satisfies ICommunitybbsAdministrator;
}
