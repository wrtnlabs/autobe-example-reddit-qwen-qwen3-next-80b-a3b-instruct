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

  // Find the administrator by email
  const admin =
    await MyGlobal.prisma.communitybbs_administrator.findFirstOrThrow({
      where: { email },
    });

  // Delete all associated sessions
  await MyGlobal.prisma.communitybbs_session.deleteMany({
    where: { actor_id: admin.id },
  });

  // Delete the administrator record
  await MyGlobal.prisma.communitybbs_administrator.delete({
    where: { id: admin.id },
  });

  // Create audit log entry
  await MyGlobal.prisma.communitybbs_log.create({
    data: {
      actor_id: administrator.id,
      target_id: admin.id,
      action_type: "administrator_deleted",
      details: JSON.stringify({ email: admin.email }),
      created_at: toISOStringSafe(new Date()),
      ip_address: null,
    },
  });

  return {};
}
