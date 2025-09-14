import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ICommunitybbsVote } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsVote";
import { MemberPayload } from "../decorators/payload/MemberPayload";

/**
 * Create a vote on a specific comment.
 *
 * This operation allows an authenticated user to cast a vote on a specific
 * comment within a community post. Votes are critical to the platform's
 * engagement model, enabling users to express approval or disapproval of
 * content. When a vote is created, it is recorded in the communitybbs_vote
 * table with a reference to the comment's ID, the actor's ID (from
 * communitybbs_member or communitybbs_administrator), and the vote type
 * ('upvote' or 'downvote'). This operation does not support creating votes for
 * anonymous guests, ensuring all votes are attributable to authenticated
 * users.
 *
 * The system enforces business rules: a user cannot vote on their own comment,
 * and each user can have only one vote per comment. If a user attempts to vote
 * on their own comment, the system returns an error. Additionally, the vote
 * type must be either 'upvote' or 'downvote', and any other value is rejected.
 *
 * This operation integrates with the communitybbs_comment table through the
 * comment_id foreign key and with the actor tables (communitybbs_member,
 * communitybbs_administrator) via the actor_id. The vote is recorded with a
 * timestamp (created_at) and does not allow modification after creation. The
 * score displayed for a comment is computed by summing upvotes minus downvotes
 * from all associated records in this table.
 *
 * This operation is used in conjunction with the DELETE operation on the same
 * endpoint to allow users to change or revoke their votes. The operation does
 * not return a response body, as the outcome is represented by the HTTP status
 * code (201 Created on success).
 *
 * @param props - Request properties
 * @param props.member - The authenticated member making the vote
 * @param props.commentId - UUID of the comment to vote on
 * @param props.body - The vote type (either 'upvote' or 'downvote')
 * @returns Void
 * @throws {Error} When the comment does not exist
 * @throws {Error} When the voting member is the author of the comment
 */
export async function postcommunitybbsMemberCommunitiesCommunityIdPostsPostIdCommentsCommentIdVotes(props: {
  member: MemberPayload;
  communityId: string & tags.Format<"uuid">;
  postId: string & tags.Format<"uuid">;
  commentId: string & tags.Format<"uuid">;
  body: ICommunitybbsVote.ICreate;
}): Promise<void> {
  const { member, commentId, body } = props;

  // Validate that the comment exists
  const comment = await MyGlobal.prisma.communitybbs_comment.findUnique({
    where: {
      id: commentId,
    },
  });

  if (!comment) {
    throw new Error("Comment not found");
  }

  // Prevent users from voting on their own comments
  if (comment.communitybbs_member_id === member.id) {
    throw new Error("Cannot vote on your own comment");
  }

  // Create the vote record
  await MyGlobal.prisma.communitybbs_vote.create({
    data: {
      actor_id: member.id,
      comment_id: commentId,
      type: body.type,
      created_at: toISOStringSafe(new Date()),
    },
  });
}
