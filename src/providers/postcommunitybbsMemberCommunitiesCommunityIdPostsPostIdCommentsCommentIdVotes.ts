import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ICommunitybbsVote } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsVote";
import { MemberPayload } from "../decorators/payload/MemberPayload";

export async function postcommunitybbsMemberCommunitiesCommunityIdPostsPostIdCommentsCommentIdVotes(props: {
  member: MemberPayload;
  communityId: string & tags.Format<"uuid">;
  postId: string & tags.Format<"uuid">;
  commentId: string & tags.Format<"uuid">;
  body: ICommunitybbsVote.ICreate;
}): Promise<void> {
  const { member, postId, commentId, body } = props;
  const { type } = body;

  // Validate vote type
  if (type !== "upvote" && type !== "downvote") {
    throw new Error(
      'Invalid vote type. Must be either "upvote" or "downvote".',
    );
  }

  // Fetch comment to validate existence, ownership, and deleted status
  const comment = await MyGlobal.prisma.communitybbs_comment.findUnique({
    where: {
      id: commentId,
    },
    select: {
      id: true,
      communitybbs_post_id: true,
      communitybbs_member_id: true,
      deleted_at: true,
    },
  });

  // Check if comment exists
  if (!comment) {
    throw new Error("Comment not found.");
  }

  // Check if comment is deleted
  if (comment.deleted_at !== null) {
    throw new Error("Cannot vote on a deleted comment.");
  }

  // Check if comment belongs to the target post
  if (comment.communitybbs_post_id !== postId) {
    throw new Error("Comment does not belong to the specified post.");
  }

  // Check if user is trying to vote on their own comment
  if (comment.communitybbs_member_id === member.id) {
    throw new Error("Cannot vote on your own comment.");
  }

  // Check if vote already exists for this actor and comment
  const existingVote = await MyGlobal.prisma.communitybbs_vote.findUnique({
    where: {
      actor_id_comment_id: {
        actor_id: member.id,
        comment_id: commentId,
      },
    },
  });

  // Toggle behavior: if vote exists, delete it; if not, create it
  if (existingVote) {
    // Delete the existing vote
    await MyGlobal.prisma.communitybbs_vote.delete({
      where: {
        id: existingVote.id,
      },
    });
  } else {
    // Create new vote
    await MyGlobal.prisma.communitybbs_vote.create({
      data: {
        actor_id: member.id,
        comment_id: commentId,
        type,
        created_at: toISOStringSafe(new Date()),
      },
    });
  }
}
