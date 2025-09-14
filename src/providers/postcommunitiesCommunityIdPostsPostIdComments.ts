import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ICommunitybbsComment } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsComment";
import { MemberPayload } from "../decorators/payload/MemberPayload";

/**
 * Create a new comment on a specific post
 *
 * This operation enables authenticated users to add comments to existing posts
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
 * The operation integrates with the communitybbs_comment entity and its
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
 * @param props.member - The authenticated member creating the comment
 * @param props.communityId - UUID of the community where the post resides
 * @param props.postId - UUID of the target post to which the comment is being
 *   added
 * @param props.body - Request body containing the comment content and optional
 *   display name
 * @returns The newly created comment object with system-generated fields like
 *   timestamp
 * @throws {Error} When the target post does not exist or does not belong to the
 *   specified community
 */
export async function postcommunitiesCommunityIdPostsPostIdComments(props: {
  member: MemberPayload;
  communityId: string & tags.Format<"uuid">;
  postId: string & tags.Format<"uuid">;
  body: ICommunitybbsComment.ICreate;
}): Promise<ICommunitybbsComment> {
  const { member, communityId, postId, body } = props;

  // Validate that the target post exists and belongs to the specified community
  const post = await MyGlobal.prisma.communitybbs_post.findUniqueOrThrow({
    where: {
      id: postId,
      communitybbs_community_id: communityId,
    },
  });

  // Create the comment directly with inline data object
  const created = await MyGlobal.prisma.communitybbs_comment.create({
    data: {
      id: v4() as string & tags.Format<"uuid">,
      communitybbs_post_id: body.communitybbs_post_id,
      communitybbs_member_id: member.id,
      content: body.content,
      display_name: body.display_name ?? member.display_name,
      created_at: toISOStringSafe(new Date()),
      updated_at: undefined,
      deleted_at: undefined,
    },
  });

  // Return the created comment
  return created;
}
