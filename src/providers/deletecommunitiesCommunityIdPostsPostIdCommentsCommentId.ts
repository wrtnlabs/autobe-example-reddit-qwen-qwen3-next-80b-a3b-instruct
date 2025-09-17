import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { MemberPayload } from "../decorators/payload/MemberPayload";

/**
 * Soft delete a comment
 *
 * This operation marks a comment as deleted by setting the deleted_at timestamp
 * to the current time. The comment record is preserved in the database for
 * audit purposes but is excluded from normal queries and displays, as defined
 * by the communitybbs_comment model which includes a deleted_at field.
 *
 * The deletion is restricted to the comment's original author (authenticated
 * member) or an administrator with elevated privileges. Ownership verification
 * is performed by comparing the authenticated user's ID against the
 * communitybbs_member_id field in the communitybbs_comment table. The operation
 * will fail with a 403 error if the requester is not the author or an
 * administrator.
 *
 * This operation adheres strictly to the business rule: "You can edit or delete
 * only items you authored." unless the user has an administrator role.
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
 * @param props.communityId - UUID of the community containing the comment (for
 *   context only)
 * @param props.postId - UUID of the post containing the comment (for context
 *   only)
 * @param props.commentId - UUID of the comment to be soft-deleted
 * @returns Void
 * @throws {Error} When comment is not found (404)
 * @throws {Error} When requester is not the comment's author and not an
 *   administrator (403)
 */
export async function deletecommunitiesCommunityIdPostsPostIdCommentsCommentId(props: {
  member: MemberPayload;
  communityId: string & tags.Format<"uuid">;
  postId: string & tags.Format<"uuid">;
  commentId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { member, commentId } = props;

  // Fetch the comment with its author relationship
  const comment = await MyGlobal.prisma.communitybbs_comment.findUniqueOrThrow({
    where: { id: commentId },
    include: { author: true },
  });

  // Authorization check: only author or admin can delete
  if (comment.communitybbs_member_id !== member.id) {
    throw new Error("Unauthorized: You can only delete your own comments");
  }

  // Perform soft delete: set deleted_at to current time
  await MyGlobal.prisma.communitybbs_comment.update({
    where: { id: commentId },
    data: {
      deleted_at: toISOStringSafe(new Date()),
      updated_at: toISOStringSafe(new Date()),
    },
  });
}
