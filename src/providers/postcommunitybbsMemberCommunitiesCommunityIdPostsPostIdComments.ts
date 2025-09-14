import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ICommunitybbsComment } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsComment";
import { MemberPayload } from "../decorators/payload/MemberPayload";

/**
 * Create a new comment on a specific post.
 *
 * This endpoint enables authenticated users to add comments to existing posts
 * within a community. The comment is stored in the communitybbs_comment table
 * and is associated with the specific post using the postId parameter and the
 * community through the communityId parameter.
 *
 * The comment content must adhere to the business rules defined in the schema:
 * minimum 2 characters and maximum 2,000 characters. The author of the comment
 * must be an authenticated member, and their display name may be provided, but
 * if included, it must not exceed 32 characters. If no display name is
 * provided, the system will use the authenticated member's display name from
 * their profile.
 *
 * Security considerations require that only authenticated members can create
 * comments; guest users are not permitted. This operation does not support
 * creating top-level comments on communities directly, only comments nested
 * under posts.
 *
 * @param props - Request properties
 * @param props.member - The authenticated member making the request
 * @param props.communityId - UUID of the community where the post resides
 * @param props.postId - UUID of the target post to which the comment is being
 *   added
 * @param props.body - Request body containing the content of the comment and
 *   optional display name
 * @returns The newly created comment object with system-generated fields like
 *   timestamps
 * @throws {Error} When the post is not found
 * @throws {Error} When the post has been deleted
 * @throws {Error} When the post does not belong to the specified community
 */
export async function postcommunitybbsMemberCommunitiesCommunityIdPostsPostIdComments(props: {
  member: MemberPayload;
  communityId: string & tags.Format<"uuid">;
  postId: string & tags.Format<"uuid">;
  body: ICommunitybbsComment.ICreate;
}): Promise<ICommunitybbsComment> {
  const { member, communityId, postId, body } = props;

  // Verify that the post exists and is not deleted
  const post = await MyGlobal.prisma.communitybbs_post.findFirst({
    where: {
      id: postId,
    },
  });

  if (!post) {
    throw new Error("Post not found");
  }

  if (post.deleted_at !== null) {
    throw new Error("Post has been deleted");
  }

  // Verify that the post belongs to the specified community
  if (post.communitybbs_community_id !== communityId) {
    throw new Error("Post does not belong to the specified community");
  }

  // Use provided display_name or fallback to member.display_name
  const displayName = body.display_name ?? member.display_name;

  // Create the comment
  const createdComment = await MyGlobal.prisma.communitybbs_comment.create({
    data: {
      id: v4() as string & tags.Format<"uuid">,
      communitybbs_post_id: postId,
      communitybbs_member_id: member.id,
      communitybbs_comment_id: null,
      content: body.content,
      display_name: displayName,
      created_at: toISOStringSafe(new Date()),
    },
  });

  // Return fully formatted ICommunitybbsComment manually to ensure type safety and proper date formatting
  return {
    id: createdComment.id,
    communitybbs_post_id: createdComment.communitybbs_post_id,
    communitybbs_member_id: createdComment.communitybbs_member_id,
    communitybbs_comment_id: createdComment.communitybbs_comment_id, // Will be null
    content: createdComment.content,
    display_name: createdComment.display_name,
    created_at: toISOStringSafe(createdComment.created_at),
    updated_at: createdComment.updated_at
      ? toISOStringSafe(createdComment.updated_at)
      : undefined,
    deleted_at: createdComment.deleted_at
      ? toISOStringSafe(createdComment.deleted_at)
      : undefined,
  };
}
