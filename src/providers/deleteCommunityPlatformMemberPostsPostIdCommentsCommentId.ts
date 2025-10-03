import { HttpException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import typia, { tags } from "typia";
import { v4 } from "uuid";
import { MyGlobal } from "../MyGlobal";
import { PasswordUtil } from "../utils/PasswordUtil";
import { toISOStringSafe } from "../utils/toISOStringSafe";

import { MemberPayload } from "../decorators/payload/MemberPayload";

export async function deleteCommunityPlatformMemberPostsPostIdCommentsCommentId(props: {
  member: MemberPayload;
  postId: string & tags.Format<"uuid">;
  commentId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { member, postId, commentId } = props;

  // Fetch comment with its author to verify ownership
  const comment = await MyGlobal.prisma.community_platform_comments.findFirst({
    where: {
      id: commentId,
      post_id: postId,
      deleted_at: null, // Only active comments can be deleted
    },
  });

  // Check if comment exists and belongs to the authenticated member
  if (!comment || comment.author_id !== member.id) {
    throw new HttpException("You can only delete comments you created.", 403);
  }

  // Generate current time once as ISO string
  const now = toISOStringSafe(new Date());

  // Perform soft delete by setting deleted_at to current UTC time
  await MyGlobal.prisma.community_platform_comments.update({
    where: { id: commentId },
    data: {
      deleted_at: now,
      updated_at: now,
    },
  });
}
