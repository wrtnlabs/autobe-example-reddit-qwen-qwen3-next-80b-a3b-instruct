import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { MemberPayload } from "../decorators/payload/MemberPayload";

/**
 * Delete a user's own post (soft delete).
 *
 * This operation permanently removes a post authored by the authenticated
 * member. When called, it performs a soft delete by updating the deleted_at
 * field in the communitybbs_post table from null to the current timestamp. This
 * preserves historical data and allows potential recovery by moderators.
 *
 * The operation checks that the communitybbs_member_id of the post matches the
 * id of the currently authenticated member to ensure ownership. If the post is
 * already deleted or does not exist, the system returns a 404 error. This
 * behavior aligns with the requirement that users can only delete their own
 * posts.
 *
 * @param props - Request properties
 * @param props.member - The authenticated member making the request
 * @param props.postId - The unique identifier of the post to be deleted
 * @returns Void
 * @throws {Error} When the post doesn't exist
 * @throws {Error} When the authenticated member is not the author of the post
 */
export async function deletemyPostsPostId(props: {
  member: MemberPayload;
  postId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { member, postId } = props;

  // Fetch the post to verify existence and ownership
  const post = await MyGlobal.prisma.communitybbs_post.findUniqueOrThrow({
    where: { id: postId },
  });

  // Verify ownership: only the author can delete
  if (post.communitybbs_member_id !== member.id) {
    throw new Error("Unauthorized: You can only delete your own posts");
  }

  // Perform soft delete by setting deleted_at to current timestamp
  await MyGlobal.prisma.communitybbs_post.update({
    where: { id: postId },
    data: {
      deleted_at: toISOStringSafe(new Date()),
    },
  });
}
