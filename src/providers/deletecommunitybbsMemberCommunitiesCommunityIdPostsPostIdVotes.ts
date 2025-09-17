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

  // Find the vote by actor_id and post_id
  const vote = await MyGlobal.prisma.communitybbs_vote.findFirstOrThrow({
    where: {
      actor_id: member.id,
      post_id: postId,
    },
  });

  // Delete the vote record
  await MyGlobal.prisma.communitybbs_vote.delete({
    where: {
      id: vote.id,
    },
  });
}
