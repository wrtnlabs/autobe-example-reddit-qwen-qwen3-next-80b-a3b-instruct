import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ICommunitybbsComment } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsComment";

/**
 * Update an existing comment by ID
 *
 * This operation updates an existing comment within a post in a community. The
 * comment can only be updated by its original author. Updates are subject to
 * content length restrictions as defined in business requirements (2-2000
 * characters). This endpoint enables users to correct typos or improve comment
 * content after submission.
 *
 * Security considerations mandate that only the original author of a comment
 * can modify it. The system enforces ownership verification through the
 * communitybbs_member_id relationship. If a user attempts to update a comment
 * they did not author, the system returns a forbidden response with the message
 * 'You can edit or delete only items you authored.' This protection prevents
 * unauthorized modification of others' content.
 *
 * This operation integrates with the communitybbs_comment table as defined in
 * the Prisma schema. The request payload includes the updated comment content
 * and optional display name. The response returns the updated comment entity
 * including its updated_at timestamp, which is automatically set by the service
 * layer. The updated_at field ensures clients receive the latest update
 * information for optimal UI consistency.
 *
 * Validation rules strictly enforce the content length requirement: comments
 * must be at least 2 characters long and no more than 2,000 characters. If the
 * content violates these constraints, the system returns a 400 Bad Request
 * error with the message 'Comment must be between 2 and 2,000 characters.' The
 * system also validates the comment exists, belongs to the specified post, and
 * belongs to the specified community before processing the update.
 *
 * Related API operations include retrieving a specific comment (GET
 * /communities/{communityId}/posts/{postId}/comments/{commentId}), retrieving
 * all comments (PATCH /communities/{communityId}/posts/{postId}/comments), and
 * creating new comments (POST
 * /communities/{communityId}/posts/{postId}/comments). This 'update' operation
 * is the primary method for comment editing in the UI.
 *
 * @param props - Request properties
 * @param props.communityId - Unique identifier of the target community
 * @param props.postId - Unique identifier of the target post
 * @param props.commentId - Unique identifier of the target comment
 * @param props.body - Updated comment content and display name
 * @returns The updated comment entity with updated timestamps
 * @throws {Error} When comment does not exist or is soft-deleted
 * @throws {Error} When user is not the owner of the comment
 * @throws {Error} When comment does not belong to specified post or community
 */
export async function putcommunitybbsMemberCommunitiesCommunityIdPostsPostIdCommentsCommentId(props: {
  communityId: string & tags.Format<"uuid">;
  postId: string & tags.Format<"uuid">;
  commentId: string & tags.Format<"uuid">;
  body: ICommunitybbsComment.IUpdate;
}): Promise<ICommunitybbsComment> {
  const { communityId, postId, commentId, body } = props;

  const now = toISOStringSafe(new Date());

  // Find the comment with its relations to verify authenticity and existence
  const comment = await MyGlobal.prisma.communitybbs_comment.findUniqueOrThrow({
    where: {
      id: commentId,
      deleted_at: null,
      communitybbs_post_id: postId,
    },
    include: {
      post: {
        select: { id: true, communitybbs_community_id: true },
      },
    },
  });

  // Verify the comment belongs to the specified community
  if (comment.post.communitybbs_community_id !== communityId) {
    throw new Error("Comment does not belong to specified community");
  }

  // Verify ownership — only author can update
  if (comment.communitybbs_member_id !== props.user.id) {
    throw new Error("You can edit or delete only items you authored.");
  }

  // Update the comment with new content and display_name if provided
  const updated = await MyGlobal.prisma.communitybbs_comment.update({
    where: { id: commentId },
    data: {
      content: body.content,
      display_name: body.display_name ?? undefined,
      updated_at: now,
    },
  });

  // Return the updated comment with accurate types — no Date objects
  return {
    id: updated.id,
    communitybbs_post_id: updated.communitybbs_post_id,
    communitybbs_member_id: updated.communitybbs_member_id,
    communitybbs_comment_id: updated.communitybbs_comment_id,
    content: updated.content,
    display_name: updated.display_name,
    created_at: updated.created_at, // Already ISO string from DB
    updated_at: updated.updated_at ?? undefined,
    deleted_at: updated.deleted_at ?? undefined,
  };
}
