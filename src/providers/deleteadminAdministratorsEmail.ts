import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IResponseEmpty } from "@ORGANIZATION/PROJECT-api/lib/structures/IResponseEmpty";
import { AdministratorPayload } from "../decorators/payload/AdministratorPayload";

export async function deleteadminAdministratorsEmail(props: {
  administrator: AdministratorPayload;
  email: string & tags.Format<"email">;
}): Promise<IResponseEmpty> {
  const { administrator, email } = props;

  // Find the administrator record by email (no deleted_at check)
  const administratorRecord =
    await MyGlobal.prisma.communitybbs_administrator.findFirstOrThrow({
      where: {
        email,
      },
    });

  // Delete all sessions associated with this administrator
  await MyGlobal.prisma.communitybbs_session.deleteMany({
    where: {
      actor_id: administratorRecord.id,
    },
  });

  // Delete the administrator record
  await MyGlobal.prisma.communitybbs_administrator.delete({
    where: {
      id: administratorRecord.id,
    },
  });

  // Create a log entry for the deletion
  await MyGlobal.prisma.communitybbs_log.create({
    data: {
      id: v4() as string & tags.Format<"uuid">,
      actor_id: administrator.id,
      target_id: administratorRecord.id,
      action_type: "administrator_deleted",
      details: JSON.stringify({
        deleted_email: email,
        deleted_admin_id: administratorRecord.id,
      }),
      created_at: toISOStringSafe(new Date()),
      ip_address: administrator.ip_address || undefined,
    },
  });

  return {};
}
