import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { AdministratorPayload } from "../decorators/payload/AdministratorPayload";

export async function deletecommunitybbsAdministratorCommunitiesCommunityId(props: {
  administrator: AdministratorPayload;
  communityId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { administrator, communityId } = props;

  // Perform hard delete of community — CASCADE will remove all related records
  await MyGlobal.prisma.communitybbs_community.delete({
    where: {
      id: communityId,
    },
  });

  // Log the deletion event
  await MyGlobal.prisma.communitybbs_log.create({
    data: {
      actor_id: administrator.id,
      target_id: communityId,
      action_type: "community_deleted",
      details: "Successfully deleted community",
      created_at: toISOStringSafe(new Date()),
    },
  });

  return;
}
