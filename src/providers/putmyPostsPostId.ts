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
 * @returns The updated post information after successful update
 * @throws {Error} When the post is not found
 * @throws {Error} When the authenticated member is not the author of the post
 */
export async function putmyPostsPostId(props: {
  member: MemberPayload;
  postId: string & tags.Format<"uuid">;
  body: IPost.IUpdate;
}): Promise<IPost> {
  const { member, postId, body } = props;

  // Fetch the post
  const post = await MyGlobal.prisma.communitybbs_post.findUniqueOrThrow({
    where: { id: postId },
  });

  // Verify ownership
  if (post.communitybbs_member_id !== member.id) {
    throw new Error("Unauthorized: You can only update your own posts");
  }

  // Perform update with direct object literal (no intermediate variables)
  const updated = await MyGlobal.prisma.communitybbs_post.update({
    where: { id: postId },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.body !== undefined && { body: body.body }),
      updated_at: toISOStringSafe(new Date()),
    },
  });

  // Return the updated post with properly formatted date fields
  return {
    id: updated.id,
    communityId: updated.communitybbs_community_id,
    author: updated.display_name || "Anonymous",
    title: updated.title,
    body: updated.body,
    created_at: toISOStringSafe(updated.created_at),
    updated_at: updated.updated_at
      ? toISOStringSafe(updated.updated_at)
      : undefined,
    deleted_at: updated.deleted_at ? toISOStringSafe(updated.deleted_at) : null,
  };
}
