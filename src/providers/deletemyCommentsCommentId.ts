import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { MemberPayload } from "../decorators/payload/MemberPayload";

/**
 * Delete a user’s own comment. This operation permanently removes a comment
 * authored by the authenticated member. Uses the communitybbs_comment table
 * where it updates the deleted_at field to mark the comment as deleted (soft
 * delete). The presence of the deleted_at column in the Prisma schema confirms
 * soft delete capability. Only the comment’s author (matching
 * communitybbs_member_id to the authenticated member) can perform deletion.
 *
 * This operation allows a member to delete a comment they authored. Upon
 * execution, it performs a soft delete by updating the deleted_at field in the
 * communitybbs_comment table to the current timestamp. This preserves the
 * comment's data for audit and moderation purposes while hiding it from regular
 * views. The system validates that the authenticated member's id matches the
 * communitybbs_member_id of the desired comment. This assertion ensures no user
 * can delete others' comments. The soft delete behavior is enabled by the
 * presence of the deleted_at column in the communitybbs_comment table in the
 * Prisma schema, which is configured as a nullable DateTime. This is consistent
 * with the business requirement that users can delete only their own content.
 * Associated votes for the comment are also logically removed via cascading
 * relationships. This operation does not affect the search index although it
 * will be updated asynchronously by the search service.
 *
 * @param props - Request properties
 * @param props.member - The authenticated member performing the deletion
 * @param props.commentId - The unique identifier of the comment to be deleted.
 *   Must match an existing communitybbs_comment.id and the comment must have
 *   been authored by the authenticated member.
 * @returns Void
 * @throws {Error} When the comment does not exist
 * @throws {Error} When the authenticated member is not the author of the
 *   comment
 */
export async function deletemyCommentsCommentId(props: {
  member: MemberPayload;
  commentId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { member, commentId } = props;

  const comment = await MyGlobal.prisma.communitybbs_comment.findUnique({
    where: { id: commentId },
  });

  if (!comment) {
    throw new Error("Comment not found");
  }

  if (comment.communitybbs_member_id !== member.id) {
    throw new Error("Unauthorized: You can only delete your own comments");
  }

  await MyGlobal.prisma.communitybbs_comment.update({
    where: { id: commentId },
    data: {
      deleted_at: toISOStringSafe(new Date()),
    },
  });
}
