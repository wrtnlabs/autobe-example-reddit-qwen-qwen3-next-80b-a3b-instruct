import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { MemberPayload } from "../decorators/payload/MemberPayload";

export async function deletecommunitiesCommunityIdLeave(props: {
  member: MemberPayload;
  communityId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { communityId } = props;

  // Find the community to ensure it exists
  const community =
    await MyGlobal.prisma.communitybbs_community.findUniqueOrThrow({
      where: { id: communityId },
    });

  // Update the community: decrement member_count and set last_active_at to current timestamp
  await MyGlobal.prisma.communitybbs_community.update({
    where: { id: communityId },
    data: {
      member_count: community.member_count - 1,
      last_active_at: toISOStringSafe(new Date()),
    },
  });
}
