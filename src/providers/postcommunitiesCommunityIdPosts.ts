import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ICommunitybbsPost } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsPost";

/**
 * Create a new post in a specified community.
 *
 * This operation requires the user to be authenticated as a member and to
 * submit a valid title and body. The title must be between 5 and 120 characters
 * and the body between 10 and 10,000 characters, as per requirements. The body
 * content must be plain text only, with no HTML, scripts, or code allowed. The
 * author's display name is captured at the time of submission and stored as
 * part of the post for consistency, even if the member later changes their
 * display name. If no display name is provided, the system defaults to
 * 'Anonymous'. The new post is associated with the given community via the
 * communityId path parameter and the authenticated member's ID. Upon successful
 * creation, the community's last_active_at timestamp is updated to the current
 * time, and the post count is incremented internally. The post is immediately
 * available in the community feed and is indexed in the search system. This
 * operation does not require soft delete handling during submission because the
 * post is created in active state only; soft deletion is a permissioned
 * moderation action handled separately. The post is created as a direct
 * user-initiated action, not a system-generated record, and must be trackable
 * to the user who submitted it. This endpoint is protected — guests cannot
 * create posts and will be redirected to login. Only the member role has
 * permission to invoke this endpoint.
 *
 * @param props - Request properties
 * @param props.communityId - Unique identifier of the community to which the
 *   post will be added
 * @param props.body - Creation data for a new post, including title, body, and
 *   optional display name
 * @returns Created post object with id, title, body, author, created_at, and
 *   score. Score is calculated as the sum of upvotes minus downvotes, initially
 *   zero.
 * @throws {Error} When community does not exist or is deleted
 * @throws {Error} When user is not authenticated
 */
export async function postcommunitiesCommunityIdPosts(props: {
  communityId: string & tags.Format<"uuid">;
  body: ICommunitybbsPost.ICreate;
}): Promise<ICommunitybbsPost.ISummary> {
  const { communityId, body } = props;

  // CRITICAL: Get authenticated user from global context - function signature lacks user param but authorization requires it
  const user = MyGlobal.user;
  if (!user) {
    throw new Error("Unauthorized: Authentication required to create posts");
  }

  // Verify community exists and is not deleted
  const community =
    await MyGlobal.prisma.communitybbs_community.findUniqueOrThrow({
      where: { id: communityId },
    });

  if (community.deleted_at !== null) {
    throw new Error("Cannot create post in a deleted community");
  }

  // Use 'Anonymous' if display_name is not provided
  const display_name =
    body.display_name === undefined ? "Anonymous" : body.display_name;

  // Create the post
  const newPost = await MyGlobal.prisma.communitybbs_post.create({
    data: {
      id: v4() as string & tags.Format<"uuid">,
      communitybbs_community_id: communityId,
      communitybbs_member_id: user.id,
      title: body.title,
      body: body.body,
      display_name: display_name,
      created_at: toISOStringSafe(new Date()),
      updated_at: toISOStringSafe(new Date()),
    },
  });

  // Update community's last_active_at
  await MyGlobal.prisma.communitybbs_community.update({
    where: { id: communityId },
    data: { last_active_at: toISOStringSafe(new Date()) },
  });

  // Return summary - comment_count and score are 0 for newly created post
  return {
    id: newPost.id,
    communitybbs_community_id: newPost.communitybbs_community_id,
    title: newPost.title,
    display_name: newPost.display_name || undefined,
    created_at: toISOStringSafe(newPost.created_at),
    comment_count: 0,
    score: 0,
  };
}
