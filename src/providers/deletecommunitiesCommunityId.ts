import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";

export async function deletecommunitiesCommunityId(props: {
  communityId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { communityId } = props;

  // Step 1: Find the community
  const community = await MyGlobal.prisma.communitybbs_community.findUnique({
    where: { id: communityId },
  });

  if (!community) {
    throw new Error("Community not found");
  }

  // Step 2: Update the community to mark as deleted
  const now = toISOStringSafe(new Date());
  await MyGlobal.prisma.communitybbs_community.update({
    where: { id: communityId },
    data: {
      deleted_at: now,
      updated_at: now,
    },
  });

  // Step 3: Create a log entry
  await MyGlobal.prisma.communitybbs_log.create({
    data: {
      id: v4() as string & tags.Format<"uuid">,
      actor_id: null,
      target_id: communityId,
      action_type: "community_deleted",
      created_at: now,
    },
  });
}
