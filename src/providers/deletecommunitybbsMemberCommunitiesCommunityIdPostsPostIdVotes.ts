import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { MemberPayload } from "../decorators/payload/MemberPayload";

export async function deletecommunitybbsMemberCommunitiesCommunityIdPostsPostIdVotes(props: {
  member: MemberPayload;
  communityId: string & tags.Format<"uuid">;
  postId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { member, postId } = props;

  // Find the vote associated with the member and post
  const vote = await MyGlobal.prisma.communitybbs_vote.findFirst({
    where: {
      actor_id: member.id,
      post_id: postId,
    },
  });

  // If no vote exists, return early (204 No Content)
  if (!vote) {
    return;
  }

  // Delete the vote record
  await MyGlobal.prisma.communitybbs_vote.delete({
    where: {
      id: vote.id,
    },
  });
}
