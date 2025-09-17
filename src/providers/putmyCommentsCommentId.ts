import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IComment } from "@ORGANIZATION/PROJECT-api/lib/structures/IComment";
import { MemberPayload } from "../decorators/payload/MemberPayload";

/**
 * Update a user’s own comment.
 *
 * This operation allows a member to edit the content of a comment they
 * authored. The system verifies that the authenticated member's id matches the
 * communitybbs_member_id in the specified comment record. It then updates the
 * content field with the new value and sets the updated_at timestamp to the
 * current time. Only the comment's author is permitted to modify it.
 *
 * This follows the schema: communitybbs_comment has fields: id,
 * communitybbs_member_id, content, updated_at.
 *
 * @param props - Request properties
 * @param props.member - The authenticated member making the request
 * @param props.commentId - UUID of the comment to update
 * @param props.body - Request body with optional content and display_name
 * @returns The updated comment
 * @throws {Error} When comment is not found
 * @throws {Error} When member is not the author of the comment
 */
export async function putmyCommentsCommentId(props: {
  member: MemberPayload;
  commentId: string & tags.Format<"uuid">;
  body: IComment.IUpdate;
}): Promise<IComment> {
  const { member, commentId, body } = props;

  // Find the comment by ID
  const comment = await MyGlobal.prisma.communitybbs_comment.findUniqueOrThrow({
    where: { id: commentId },
  });

  // Verify that the authenticated member is the author
  if (comment.communitybbs_member_id !== member.id) {
    throw new Error("Unauthorized: You can only update your own comments");
  }

  // Prepare update data
  const updateData: {
    content?: string;
    updated_at?: string & tags.Format<"date-time">;
  } = {};

  // Only update content if provided in body
  if (body.content !== undefined) {
    updateData.content = body.content;
  }

  // Always update updated_at to current time
  updateData.updated_at = toISOStringSafe(new Date());

  // Perform update and return
  const updated = await MyGlobal.prisma.communitybbs_comment.update({
    where: { id: commentId },
    data: updateData,
  });

  // Return fully-resolved IComment type
  return {
    id: updated.id,
    postId: updated.communitybbs_post_id,
    author: updated.display_name || "Anonymous",
    parentId: updated.communitybbs_comment_id || undefined,
    content: updated.content,
    created_at: updated.created_at,
    updated_at: updated.updated_at || undefined,
    deleted_at: updated.deleted_at ?? null,
  };
}
