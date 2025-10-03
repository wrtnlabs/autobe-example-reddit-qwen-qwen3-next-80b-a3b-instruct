import { HttpException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import typia, { tags } from "typia";
import { v4 } from "uuid";
import { MyGlobal } from "../MyGlobal";
import { PasswordUtil } from "../utils/PasswordUtil";
import { toISOStringSafe } from "../utils/toISOStringSafe";

import { ICommunityPlatformCommentVoteRequest } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommentVoteRequest";
import { ICommunityPlatformCommentVoteResponse } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommentVoteResponse";
import { MemberPayload } from "../decorators/payload/MemberPayload";

export async function postCommunityPlatformMemberCommentsCommentIdVotes(props: {
  member: MemberPayload;
  commentId: string & tags.Format<"uuid">;
  body: ICommunityPlatformCommentVoteRequest;
}): Promise<ICommunityPlatformCommentVoteResponse> {
  const { member, commentId, body } = props;

  // Get the comment and its author
  const comment = await MyGlobal.prisma.community_platform_comments.findUnique({
    where: { id: commentId },
    select: { author_id: true },
  });

  if (!comment) {
    throw new HttpException("Comment not found", 404);
  }

  // Check if user is trying to vote on their own comment
  if (comment.author_id === member.id) {
    throw new HttpException("You can't vote on your own posts/comments.", 403);
  }

  // Use a transaction to ensure atomicity
  const newScore = await MyGlobal.prisma.$transaction(async (prisma) => {
    // Find existing vote
    const existingVote =
      await prisma.community_platform_comment_votes.findUnique({
        where: {
          community_platform_comment_id_community_platform_user_id: {
            community_platform_comment_id: commentId,
            community_platform_user_id: member.id,
          },
        },
      });

    // Determine the score change based on current state and requested vote
    let scoreChange = 0;

    if (!existingVote) {
      // No existing vote: create new vote
      await prisma.community_platform_comment_votes.create({
        data: {
          id: v4() as string & tags.Format<"uuid">,
          community_platform_comment_id: commentId,
          community_platform_user_id: member.id,
          vote_state: body.vote_state,
          created_at: toISOStringSafe(new Date()),
          updated_at: toISOStringSafe(new Date()),
        },
      });
      // Add 1 for upvote, -1 for downvote
      scoreChange = body.vote_state === "upvote" ? 1 : -1;
    } else if (existingVote.vote_state === body.vote_state) {
      // Same vote: remove it
      await prisma.community_platform_comment_votes.delete({
        where: { id: existingVote.id },
      });
      // Subtract 1 for upvote, add 1 for downvote
      scoreChange = existingVote.vote_state === "upvote" ? -1 : 1;
    } else {
      // Different vote: update it
      await prisma.community_platform_comment_votes.update({
        where: { id: existingVote.id },
        data: {
          vote_state: body.vote_state,
          updated_at: toISOStringSafe(new Date()),
        },
      });
      // Subtract previous vote and add new vote
      const oldVoteValue = existingVote.vote_state === "upvote" ? 1 : -1;
      const newVoteValue = body.vote_state === "upvote" ? 1 : -1;
      scoreChange = newVoteValue - oldVoteValue;
    }

    // Update score atomically
    // If comment stats exists, update it, else create
    const commentStats =
      await prisma.community_platform_comment_stats.findUnique({
        where: { community_platform_comment_id: commentId },
      });

    if (commentStats) {
      await prisma.community_platform_comment_stats.update({
        where: { community_platform_comment_id: commentId },
        data: { score: { increment: scoreChange } },
      });
      return commentStats.score + scoreChange;
    } else {
      // Create stats if doesn't exist
      await prisma.community_platform_comment_stats.create({
        data: {
          id: v4() as string & tags.Format<"uuid">,
          community_platform_comment_id: commentId,
          score: scoreChange,
        },
      });
      return scoreChange;
    }
  });

  // Return as object matching ICommunityPlatformCommentVoteResponse interface
  return { score: newScore };
}
