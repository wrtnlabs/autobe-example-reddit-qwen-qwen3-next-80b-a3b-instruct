import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IComment } from "@ORGANIZATION/PROJECT-api/lib/structures/IComment";
import { MemberPayload } from "../decorators/payload/MemberPayload";

/**
 * Update the content of a user's own comment.
 *
 * This operation allows a member to edit the content of a comment they
 * authored. The system verifies that the authenticated member's id matches the
 * communitybbs_member_id in the specified comment record, then updates the
 * content field with the new value. The updated_at timestamp is set to the
 * current time.
 *
 * Authorization Rule: Only the original author of the comment can update it.
 *
 * @param props - Request properties
 * @param props.member - The authenticated member making the request
 * @param props.commentId - The unique identifier of the comment to be updated
 * @param props.body - The new content and display_name for update (display_name
 *   is ignored)
 * @returns The updated comment with all fields populated
 * @throws {Error} When comment does not exist
 * @throws {Error} When the authenticated member is not the author of the
 *   comment
 */
export async function putmyCommentsCommentId(props: {
  member: MemberPayload;
  commentId: string & tags.Format<"uuid">;
  body: IComment.IUpdate;
}): Promise<IComment> {
  const { member, commentId, body } = props;

  // Fetch comment with its member record for display_name and ownership verification
  const comment = await MyGlobal.prisma.communitybbs_comment.findUnique({
    where: { id: commentId },
    include: { author: true },
  });

  // Handle case where comment does not exist
  if (!comment) {
    throw new Error("Comment not found");
  }

  // Verify that authenticated member is the author of the comment
  if (member.id !== comment.communitybbs_member_id) {
    throw new Error("Unauthorized: You can only update your own comments");
  }

  // Build update data object
  // - content: update if provided (body.content !== undefined), otherwise keep current value
  // - updated_at: always update to current timestamp (ISO string)
  const updateData = {
    content: body.content !== undefined ? body.content : comment.content,
    updated_at: toISOStringSafe(new Date()),
  };

  // Perform the update
  const updated = await MyGlobal.prisma.communitybbs_comment.update({
    where: { id: commentId },
    data: updateData,
  });

  // Construct and return the IComment response
  return {
    id: comment.id,
    postId: comment.communitybbs_post_id,
    author: comment.author.display_name, // Correctly using the relation name "author"
    parentId: comment.communitybbs_comment_id,
    content: updated.content,
    created_at: toISOStringSafe(comment.created_at),
    updated_at: toISOStringSafe(updated.updated_at),
    deleted_at: comment.deleted_at
      ? toISOStringSafe(comment.deleted_at)
      : undefined,
  };
}
