import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IPost } from "@ORGANIZATION/PROJECT-api/lib/structures/IPost";
import { MemberPayload } from "../decorators/payload/MemberPayload";

/**
 * Update the title or body of a user's own post.
 *
 * This operation allows a member to edit the title or body of a post they
 * authored. When processing, the system validates that the authenticated
 * member_id matches the communitybbs_member_id of the post being edited. The
 * operation updates the title and/or body fields in the communitybbs_post table
 * with the new values, ensuring they meet the length constraints (5-120
 * characters for title, 10-10,000 for body). The updated_at field is
 * automatically set to the current timestamp. Only the title and body can be
 * updated — the author, community, and creation timestamps are immutable. The
 * display_name field, if present, is preserved from the original record and not
 * updated to reflect the member's current display_name. Validation is applied
 * via the requirement constraints in the prisma schema and not through separate
 * validation layers. This enables users to correct typos or expand on their
 * thoughts while maintaining content integrity. This modifiability is enabled
 * by the schema's design where updated_at is present and writable, unlike
 * created_at. The operation also triggers asynchronous index updates to
 * communitybbs_search_post for search relevance.
 *
 * @param props - Request properties
 * @param props.member - The authenticated member making the request
 * @param props.postId - The unique identifier of the post to be updated
 * @param props.body - Request body containing updated title and/or body content
 *   for the post
 * @returns The updated post information after successful update
 * @throws {Error} When the post does not exist or the user is not the author
 */
export async function putmyPostsPostId(props: {
  member: MemberPayload;
  postId: string & tags.Format<"uuid">;
  body: IPost.IUpdate;
}): Promise<IPost> {
  const { member, postId, body } = props;

  // Fetch the post and verify ownership
  const post = await MyGlobal.prisma.communitybbs_post.findUniqueOrThrow({
    where: {
      id: postId,
      communitybbs_member_id: member.id,
    },
  });

  // Build update data object
  const updateData: any = {};

  // Update title if provided and not null/undefined
  if (body.title !== undefined) {
    updateData.title = body.title;
  }

  // Update body if provided and not null/undefined
  if (body.body !== undefined) {
    updateData.body = body.body;
  }

  // Always update updated_at to current time
  updateData.updated_at = toISOStringSafe(new Date());

  // Perform the update
  const updated = await MyGlobal.prisma.communitybbs_post.update({
    where: { id: postId },
    data: updateData,
  });

  // Fetch the updated post with all fields to return as IPost
  const result = await MyGlobal.prisma.communitybbs_post.findUnique({
    where: { id: postId },
  });

  if (!result) {
    throw new Error("Post not found after update");
  }

  // Count comments for comment_count field
  const commentCount = await MyGlobal.prisma.communitybbs_comment.count({
    where: {
      communitybbs_post_id: postId,
      deleted_at: null,
    },
  });

  // Count votes for score field
  const votes = await MyGlobal.prisma.communitybbs_vote.findMany({
    where: {
      post_id: postId,
    },
  });

  const score =
    votes.filter((v) => v.type === "upvote").length -
    votes.filter((v) => v.type === "downvote").length;

  // Return the formatted IPost object with all field types correct
  return {
    id: result.id,
    communityId: result.communitybbs_community_id,
    author: result.display_name || "Anonymous",
    title: result.title,
    body: result.body,
    created_at: toISOStringSafe(result.created_at),
    updated_at: result.updated_at
      ? toISOStringSafe(result.updated_at)
      : undefined,
    deleted_at: result.deleted_at ? toISOStringSafe(result.deleted_at) : null,
    score: score,
    comment_count: commentCount,
  };
}
