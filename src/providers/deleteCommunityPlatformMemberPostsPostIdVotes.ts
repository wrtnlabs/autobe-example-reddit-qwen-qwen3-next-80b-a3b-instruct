import { HttpException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import typia, { tags } from "typia";
import { v4 } from "uuid";
import { MyGlobal } from "../MyGlobal";
import { PasswordUtil } from "../utils/PasswordUtil";
import { toISOStringSafe } from "../utils/toISOStringSafe";

import { MemberPayload } from "../decorators/payload/MemberPayload";

export async function deleteCommunityPlatformMemberPostsPostIdVotes(props: {
  member: MemberPayload;
  postId: string & tags.Format<"uuid">;
}): Promise<void> {
  await MyGlobal.prisma.community_platform_post_votes.deleteMany({
    where: {
      community_platform_post_id: props.postId,
      community_platform_user_id: props.member.id,
    },
  });
}
