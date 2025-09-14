import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IResponseEmpty } from "@ORGANIZATION/PROJECT-api/lib/structures/IResponseEmpty";
import { AdministratorPayload } from "../decorators/payload/AdministratorPayload";

export async function deleteadminCommunitiesNamePermanentDelete(props: {
  administrator: AdministratorPayload;
  name: string;
}): Promise<IResponseEmpty> {
  const { administrator, name } = props;

  // Find the community by name using unique constraint
  const community =
    await MyGlobal.prisma.communitybbs_community.findUniqueOrThrow({
      where: { name },
    });

  // Delete the community record - cascading deletion will automatically remove all related:
  // - posts (communitybbs_post)
  // - comments (communitybbs_comment)
  // - votes (communitybbs_vote)
  // - search indexes (communitybbs_search_post, communitybbs_search_comment, communitybbs_search_community)
  await MyGlobal.prisma.communitybbs_community.delete({
    where: { id: community.id },
  });

  // Create audit log entry with complete context
  await MyGlobal.prisma.communitybbs_log.create({
    data: {
      actor_id: administrator.id,
      target_id: community.id,
      action_type: "community_permanently_deleted",
      details: JSON.stringify({
        deleted_by: administrator.id,
        community_name: name,
      }),
      created_at: toISOStringSafe(new Date()),
      ip_address: null,
    },
  });

  // Return empty response satisfying IResponseEmpty type
  return {} satisfies IResponseEmpty;
}
