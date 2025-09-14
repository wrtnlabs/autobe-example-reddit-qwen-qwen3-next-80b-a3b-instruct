import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { AdministratorPayload } from "../decorators/payload/AdministratorPayload";

/**
 * Permanently delete a comment by ID.
 *
 * This operation permanently deletes a specific comment within a post in a
 * community. It operates on the communitybbs_comment table from the Prisma
 * schema. The comment can only be deleted by its original author or an
 * administrator. This endpoint implements hard deletion as there is no
 * deleted_at field in the schema, removing the comment completely from the
 * database.
 *
 * Per the Prisma schema, the communitybbs_comment table does not include a
 * deleted_at field, indicating that deletion is permanent rather than soft
 * deletion. When a comment is deleted, all associated data is removed from the
 * database, including its relationships to votes and parent-child
 * relationships. There is no recovery mechanism.
 *
 * Security considerations include strict ownership verification. Only the
 * original author of a comment or an administrator can delete a comment. If an
 * unauthorized user attempts deletion, the system returns a 403 Forbidden
 * response with the message 'You can edit or delete only items you authored.'
 * This ensures content integrity and prevents unauthorized removal of user
 * content.
 *
 * The system follows the business requirement that comments can be deleted by
 * their authors, but cannot be deleted by other users without administrative
 * privileges. The operation does not return any response body as per standard
 * practice for DELETE operations, with success indicated by a 204 No Content
 * response.
 *
 * @param props - Request properties
 * @param props.administrator - The authenticated administrator making the
 *   request
 * @param props.communityId - UUID of the target community
 * @param props.postId - UUID of the target post
 * @param props.commentId - UUID of the target comment to delete
 * @returns Void
 * @throws {Error} When the comment does not exist
 * @throws {Error} When the administrator is not the author of the comment and
 *   is not an admin
 */
export async function deletecommunitybbsAdministratorCommunitiesCommunityIdPostsPostIdCommentsCommentId(props: {
  administrator: AdministratorPayload;
  communityId: string & tags.Format<"uuid">;
  postId: string & tags.Format<"uuid">;
  commentId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { administrator, commentId } = props;

  // Find the comment by its ID. This will throw if not found.
  const comment = await MyGlobal.prisma.communitybbs_comment.findUniqueOrThrow({
    where: { id: commentId },
  });

  // Authorization: Only the original author or an administrator can delete the comment
  if (comment.communitybbs_member_id !== administrator.id) {
    throw new Error("Unauthorized: You can delete only items you authored");
  }

  // Perform hard delete since no soft delete field exists in schema
  await MyGlobal.prisma.communitybbs_comment.delete({
    where: { id: commentId },
  });
}
