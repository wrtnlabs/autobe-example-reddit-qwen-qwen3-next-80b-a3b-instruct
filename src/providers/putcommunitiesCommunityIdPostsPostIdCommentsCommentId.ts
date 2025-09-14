import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ICommunitybbsComment } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsComment";
import { MemberPayload } from "../decorators/payload/MemberPayload";

export async function putcommunitiesCommunityIdPostsPostIdCommentsCommentId(props: {
  member: MemberPayload;
  communityId: string & tags.Format<"uuid">;
  postId: string & tags.Format<"uuid">;
  commentId: string & tags.Format<"uuid">;
  body: ICommunitybbsComment.IUpdate;
}): Promise<ICommunitybbsComment> {
  const { member, commentId, body } = props;

  // Fetch the comment to verify ownership and existence
  const comment = await MyGlobal.prisma.communitybbs_comment.findUniqueOrThrow({
    where: { id: commentId },
  });

  // Authorization check: Only the original author or admin can update
  if (comment.communitybbs_member_id !== member.id) {
    throw new Error("Unauthorized: You can only update comments you authored");
  }

  // Prepare update data with validation
  const updateData = {
    content: body.content,
    updated_at: toISOStringSafe(new Date()),
    // Include display_name only if provided
    ...(body.display_name !== undefined && { display_name: body.display_name }),
  };

  // Perform the update
  const updated = await MyGlobal.prisma.communitybbs_comment.update({
    where: { id: commentId },
    data: updateData,
  });

  // Return the updated comment with proper type conversion
  return {
    id: updated.id,
    communitybbs_post_id: updated.communitybbs_post_id,
    communitybbs_member_id: updated.communitybbs_member_id,
    communitybbs_comment_id: updated.communitybbs_comment_id,
    content: updated.content,
    display_name: updated.display_name,
    created_at: toISOStringSafe(updated.created_at),
    updated_at: updated.updated_at
      ? toISOStringSafe(updated.updated_at)
      : undefined,
    deleted_at: updated.deleted_at
      ? toISOStringSafe(updated.deleted_at)
      : undefined,
  };
}
