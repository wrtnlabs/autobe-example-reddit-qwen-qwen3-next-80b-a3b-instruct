import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { MemberPayload } from "../decorators/payload/MemberPayload";

/**
 * Delete a user’s own post.
 *
 * This operation permanently removes a post authored by the authenticated
 * member. Uses the communitybbs_post table, where it updates the deleted_at
 * field to mark the post as deleted (soft delete). This behavior is determined
 * by the presence of the deleted_at column in the Prisma schema, which exists
 * for soft deletion capability. The operation is only permitted if the
 * member_id matches the post's communitybbs_member_id. Authorization is
 * role-based to the member who created the post.
 *
 * @param props - Request properties
 * @param props.member - The authenticated member making the deletion request
 * @param props.postId - The unique identifier of the post to be deleted. Must
 *   be an existing record in communitybbs_post.id and authored by the member.
 * @returns Void
 * @throws {Error} When the post does not exist (404)
 * @throws {Error} When the authenticated member is not the author of the post
 */
export async function deletemyPostsPostId(props: {
  member: MemberPayload;
  postId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { member, postId } = props;

  const post = await MyGlobal.prisma.communitybbs_post.findUniqueOrThrow({
    where: { id: postId },
  });

  if (post.communitybbs_member_id !== member.id) {
    throw new Error("Unauthorized: You can only delete your own posts");
  }

  await MyGlobal.prisma.communitybbs_post.update({
    where: { id: postId },
    data: {
      deleted_at: toISOStringSafe(new Date()),
    },
  });
}
