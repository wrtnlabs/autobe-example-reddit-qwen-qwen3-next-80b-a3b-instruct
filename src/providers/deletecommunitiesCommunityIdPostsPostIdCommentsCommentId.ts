import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { MemberPayload } from "../decorators/payload/MemberPayload";

/**
 * Soft delete a comment.
 *
 * This operation marks a comment as deleted by setting the deleted_at timestamp
 * to the current time. The comment record is preserved in the database for
 * audit purposes but is excluded from normal queries and displays, as defined
 * by the communitybbs_comment model which includes a deleted_at field.
 *
 * The deletion is restricted to the comment's original author (authenticated
 * member). Ownership verification is performed by comparing the authenticated
 * user's ID against the communitybbs_member_id field in the
 * communitybbs_comment table. The operation will fail with a 403 error if the
 * requester is not the author.
 *
 * This operation adheres strictly to the business rule: "You can edit or delete
 * only items you authored."
 *
 * When a comment is soft-deleted, it remains in the database with its completed
 * data, and any nested replies are also marked as deleted via the foreign key
 * relationships. This preserves data integrity and enables potential recovery
 * while hiding the content from users.
 *
 * The system automatically logs this deletion event in the communitybbs_log
 * table as a side effect (action_type: 'comment_deleted'), but there is no
 * separate API endpoint to create or manage these logs.
 *
 * @param props - Request properties
 * @param props.member - The authenticated member making the request
 * @param props.commentId - UUID of the comment to be soft-deleted
 * @param props.postId - UUID of the post containing the comment (for
 *   validation)
 * @param props.communityId - UUID of the community containing the post
 *   (contextual only)
 * @throws {Error} When the comment does not exist
 * @throws {Error} When the user is not the author of the comment
 */
export async function deletecommunitiesCommunityIdPostsPostIdCommentsCommentId(props: {
  member: MemberPayload;
  communityId: string & tags.Format<"uuid">;
  postId: string & tags.Format<"uuid">;
  commentId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { member, postId, commentId } = props;

  // Generate the current timestamp once
  const now: string & tags.Format<"date-time"> = toISOStringSafe(new Date());

  // Fetch the target comment with ownership validation
  const comment = await MyGlobal.prisma.communitybbs_comment.findUniqueOrThrow({
    where: { id: commentId },
  });

  // Verify ownership: only the author can delete
  if (comment.communitybbs_member_id !== member.id) {
    throw new Error("Unauthorized: You can only delete your own comments");
  }

  // Verify the comment belongs to the expected post (data integrity check)
  if (comment.communitybbs_post_id !== postId) {
    throw new Error(
      "Unauthorized: Comment does not belong to the specified post",
    );
  }

  // Update the comment with soft delete and update timestamp
  await MyGlobal.prisma.communitybbs_comment.update({
    where: { id: commentId },
    data: {
      deleted_at: now,
      updated_at: now,
    },
  });
}
