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
 * This operation integrates with the communitybbs_comment entity and its
 * relationship to communitybbs_post, which has a foreign key relationship
 * established between post_id and id. This ensures referential integrity so
 * that comments cannot be created for non-existent posts.
 *
 * This operation triggers system-generated logging events as defined in the
 * communitybbs_log model, but there is no separate API to create or manage
 * these logs - they are created automatically as a side effect of this
 * operation. The comment's creation timestamp is automatically set by the
 * system and cannot be overridden by the client.
 *
 * @param props - Request properties
 * @param props.member - The authenticated member making the request
 * @param props.communityId - UUID of the community containing the target post
 * @param props.postId - UUID of the target post to comment on
 * @param props.body - The comment creation data including content and optional
 *   display name
 * @returns The newly created comment with all system-generated fields populated
 * @throws {Error} When the target post doesn't exist or is deleted
 * @throws {Error} When the target community doesn't exist or is deleted
 * @throws {Error} When the post doesn't belong to the specified community
 * @throws {Error} When the member doesn't exist or is inactive
 */
export async function postcommunitybbsMemberCommunitiesCommunityIdPostsPostIdComments(props: {
  member: MemberPayload;
  communityId: string & tags.Format<"uuid">;
  postId: string & tags.Format<"uuid">;
  body: ICommunitybbsComment.ICreate;
}): Promise<ICommunitybbsComment> {
  const { member, communityId, postId, body } = props;

  // Get the specific post
  const post = await MyGlobal.prisma.communitybbs_post.findUniqueOrThrow({
    where: {
      id: postId,
    },
    select: {
      id: true,
      communitybbs_community_id: true,
      deleted_at: true,
    },
  });

  // Verify post isn't deleted
  if (post.deleted_at !== null) {
    throw new Error("Cannot comment on a deleted post");
  }

  // Verify post belongs to the specified community
  if (post.communitybbs_community_id !== communityId) {
    throw new Error("Post does not belong to the specified community");
  }

  // Get the community
  const community =
    await MyGlobal.prisma.communitybbs_community.findUniqueOrThrow({
      where: {
        id: communityId,
      },
      select: {
        id: true,
        deleted_at: true,
      },
    });

  // Verify community isn't deleted
  if (community.deleted_at !== null) {
    throw new Error("Cannot comment in a deleted community");
  }

  // Verify member exists and is active
  const memberRecord =
    await MyGlobal.prisma.communitybbs_member.findUniqueOrThrow({
      where: {
        id: member.id,
      },
      select: {
        id: true,
      },
    });

  // Create the comment
  const newComment = await MyGlobal.prisma.communitybbs_comment.create({
    data: {
      id: v4() as string & tags.Format<"uuid">,
      communitybbs_post_id: postId,
      communitybbs_member_id: member.id,
      communitybbs_comment_id: undefined,
      content: body.content,
      display_name: body.display_name ?? undefined,
      created_at: toISOStringSafe(new Date()),
      updated_at: undefined,
      deleted_at: undefined,
    },
    select: {
      id: true,
      communitybbs_post_id: true,
      communitybbs_member_id: true,
      communitybbs_comment_id: true,
      content: true,
      display_name: true,
      created_at: true,
      updated_at: true,
      deleted_at: true,
    },
  });

  return newComment;
}
