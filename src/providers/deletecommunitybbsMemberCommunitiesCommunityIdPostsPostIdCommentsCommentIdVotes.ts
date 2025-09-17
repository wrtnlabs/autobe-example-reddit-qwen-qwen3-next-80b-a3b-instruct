import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { MemberPayload } from "../decorators/payload/MemberPayload";

export async function deletecommunitybbsMemberCommunitiesCommunityIdPostsPostIdCommentsCommentIdVotes(props: {
  member: MemberPayload;
  communityId: string & tags.Format<"uuid">;
  postId: string & tags.Format<"uuid">;
  commentId: string & tags.Format<"uuid">;
}): Promise<void> {
  await MyGlobal.prisma.communitybbs_vote.delete({
    where: {
      comment_id: props.commentId,
      actor_id: props.member.id,
    },
  });
}
