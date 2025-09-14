import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { MemberPayload } from "../decorators/payload/MemberPayload";

export async function postcommunitiesCommunityIdJoin(props: {
  member: MemberPayload;
  communityId: string & tags.Format<"uuid">;
}): Promise<void> {
  // Validate community exists and is not deleted
  const community = await MyGlobal.prisma.communitybbs_community.findFirst({
    where: {
      id: props.communityId,
      deleted_at: null,
    },
  });

  if (!community) {
    throw new Error("Community not found");
  }

  // Validate member exists (no soft-delete check as member model has no deleted_at field)
  const member = await MyGlobal.prisma.communitybbs_member.findFirst({
    where: {
      id: props.member.id,
    },
  });

  if (!member) {
    throw new Error("Member not found");
  }

  // Update community: increment member_count and set last_active_at to current time
  // IMPORTANT: The join action is idempotent per requirements, but schema has no membership tracking
  // This function will always increment member_count and update last_active_at regardless of existing membership
  // The application-level logic must prevent duplicate joins, per business requirement
  await MyGlobal.prisma.communitybbs_community.update({
    where: {
      id: props.communityId,
    },
    data: {
      member_count: community.member_count + 1,
      last_active_at: toISOStringSafe(new Date()),
    },
  });
}
