import { HttpException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import typia, { tags } from "typia";
import { v4 } from "uuid";
import { MyGlobal } from "../MyGlobal";
import { PasswordUtil } from "../utils/PasswordUtil";
import { toISOStringSafe } from "../utils/toISOStringSafe";

import { ICommunityPlatformPost } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformPost";
import { MemberPayload } from "../decorators/payload/MemberPayload";

export async function patchCommunityPlatformMemberPostsPostIdVotes(props: {
  member: MemberPayload;
  postId: string & tags.Format<"uuid">;
  body: ICommunityPlatformPost.IRequest;
}): Promise<ICommunityPlatformPost.IVoteState> {
  const voteRecord =
    await MyGlobal.prisma.community_platform_post_votes.findFirst({
      where: {
        community_platform_post_id: props.postId,
        community_platform_user_id: props.member.id,
      },
    });

  if (!voteRecord) {
    return { state: "none" };
  }

  return {
    state: voteRecord.vote_state satisfies string as
      | "upvote"
      | "downvote"
      | "none",
  };
}
