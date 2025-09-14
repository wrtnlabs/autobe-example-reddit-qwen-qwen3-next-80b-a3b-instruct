import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { MemberPayload } from "../decorators/payload/MemberPayload";

/**
 * Delete a vote on a specific comment
 *
 * This operation enables an authenticated user to remove their previously cast
 * vote on a specific comment within a community post. The vote is identified by
 * the comment_id in the path and the actor's identity from the authenticated
 * session. When deleted, the record is permanently removed from the
 * communitybbs_vote table, causing the comment's score (upvotes minus
 * downvotes) to be recalculated without this vote.
 *
 * No request body is required, as the system uses the path parameters
 * (communityId, postId, commentId) to locate the vote and the user's
 * authentication context (from session) to identify the actor. The system
 * ensures that only the user who originally cast the vote can delete it,
 * enforcing ownership through the actor_id foreign key relationship with
 * communitybbs_member or communitybbs_administrator.
 *
 * This operation supports the business requirement that users can change their
 * mind about a vote: clicking 'upvote' after previously 'downvoting' will first
 * delete the old vote and then create a new one. The operation returns a 204 No
 * Content status on success, indicating successful deletion without returning a
 * response body. This design ensures efficiency and aligns with stateless REST
 * principles.
 *
 * The system does not allow non-owning users to delete votes, enforcing that
 * users cannot delete votes cast by others. This preserves the integrity and
 * authenticity of community feedback.
 *
 * @param props - Request properties
 * @param props.member - The authenticated member making the request
 * @param props.communityId - UUID of the target community
 * @param props.postId - UUID of the target post containing the comment
 * @param props.commentId - UUID of the target comment on which the vote is
 *   being deleted
 * @returns Void
 * @throws {Error} When the comment does not exist or does not belong to the
 *   specified post
 * @throws {Error} When the vote does not exist or is not owned by the
 *   authenticated member
 */
export async function deletecommunitybbsMemberCommunitiesCommunityIdPostsPostIdCommentsCommentIdVotes(props: {
  member: MemberPayload;
  communityId: string & tags.Format<"uuid">;
  postId: string & tags.Format<"uuid">;
  commentId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { member, postId, commentId } = props;

  // STEP 1: Validate the comment exists and belongs to the given post
  const comment = await MyGlobal.prisma.communitybbs_comment.findUniqueOrThrow({
    where: {
      id: commentId,
      communitybbs_post_id: postId,
    },
  });

  // STEP 2: Find the vote made by the member on this specific comment
  const vote = await MyGlobal.prisma.communitybbs_vote.findUnique({
    where: {
      actor_id_comment_id: {
        actor_id: member.id,
        comment_id: commentId,
      },
    },
  });

  // STEP 3: Verify vote exists and is owned by the member
  if (!vote) {
    throw new Error("Vote not found or not owned by user");
  }

  // STEP 4: Permanently delete the vote record (hard delete - no soft-delete field exists)
  await MyGlobal.prisma.communitybbs_vote.delete({
    where: {
      id: vote.id,
    },
  });

  return;
}
