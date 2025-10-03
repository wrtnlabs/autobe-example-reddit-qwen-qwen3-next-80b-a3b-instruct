import { HttpException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import typia, { tags } from "typia";
import { v4 } from "uuid";
import { MyGlobal } from "../MyGlobal";
import { PasswordUtil } from "../utils/PasswordUtil";
import { toISOStringSafe } from "../utils/toISOStringSafe";

import { ICommunityPlatformCommentVoteResponse } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommentVoteResponse";
import { MemberPayload } from "../decorators/payload/MemberPayload";

export async function deleteCommunityPlatformMemberCommentsCommentIdVotes(props: {
  member: MemberPayload;
  commentId: string & tags.Format<"uuid">;
}): Promise<ICommunityPlatformCommentVoteResponse> {
  // Find the vote record using the compound unique key
  const vote =
    await MyGlobal.prisma.community_platform_comment_votes.findUniqueOrThrow({
      where: {
        community_platform_comment_id_community_platform_user_id: {
          community_platform_comment_id: props.commentId,
          community_platform_user_id: props.member.id,
        },
      },
    });

  // Delete the vote
  await MyGlobal.prisma.community_platform_comment_votes.delete({
    where: {
      id: vote.id,
    },
  });

  // Retrieve current score from comment_stats
  const currentStats =
    await MyGlobal.prisma.community_platform_comment_stats.findUniqueOrThrow({
      where: {
        community_platform_comment_id: props.commentId,
      },
    });

  // Calculate new score after removing vote
  const scoreChange = vote.vote_state === "upvote" ? -1 : 1;
  const newScore = currentStats.score + scoreChange;

  // Update the comment score in comment_stats
  const updatedStats =
    await MyGlobal.prisma.community_platform_comment_stats.upsert({
      where: {
        community_platform_comment_id: props.commentId,
      },
      update: {
        score: newScore,
      },
      create: {
        id: v4() as string & tags.Format<"uuid">,
        community_platform_comment_id: props.commentId,
        score: newScore,
      },
    });

  // Return the updated score
  const response: ICommunityPlatformCommentVoteResponse = {
    score: updatedStats.score,
  } satisfies ICommunityPlatformCommentVoteResponse;

  return response;
}
