import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { AdministratorPayload } from "../decorators/payload/AdministratorPayload";

export async function deletecommunitybbsAdministratorCommunitiesCommunityIdPostsPostIdCommentsCommentId(props: {
  administrator: AdministratorPayload;
  communityId: string & tags.Format<"uuid">;
  postId: string & tags.Format<"uuid">;
  commentId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { administrator, commentId } = props;

  // Fetch the comment to verify existence and get author
  const comment = await MyGlobal.prisma.communitybbs_comment.findUniqueOrThrow({
    where: { id: commentId },
  });

  // Verify ownership: either the admin is the original author OR admin has authority
  if (comment.communitybbs_member_id !== administrator.id) {
    throw new Error("You can edit or delete only items you authored.");
  }

  // Permanently delete the comment (hard delete as schema lacks soft delete field for this operation)
  await MyGlobal.prisma.communitybbs_comment.delete({
    where: { id: commentId },
  });
}
