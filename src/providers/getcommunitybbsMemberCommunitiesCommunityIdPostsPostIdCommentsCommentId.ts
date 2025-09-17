import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ICommunitybbsComment } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsComment";

export async function getcommunitybbsMemberCommunitiesCommunityIdPostsPostIdCommentsCommentId(props: {
  communityId: string & tags.Format<"uuid">;
  postId: string & tags.Format<"uuid">;
  commentId: string & tags.Format<"uuid">;
}): Promise<ICommunitybbsComment> {
  const { postId, commentId } = props;

  const comment = await MyGlobal.prisma.communitybbs_comment.findUniqueOrThrow({
    where: {
      id: commentId,
      communitybbs_post_id: postId,
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

  return {
    id: comment.id,
    communitybbs_post_id: comment.communitybbs_post_id,
    communitybbs_member_id: comment.communitybbs_member_id,
    communitybbs_comment_id: comment.communitybbs_comment_id,
    content: comment.content,
    display_name: comment.display_name,
    created_at: toISOStringSafe(comment.created_at),
    updated_at: comment.updated_at
      ? toISOStringSafe(comment.updated_at)
      : undefined,
    deleted_at: comment.deleted_at
      ? toISOStringSafe(comment.deleted_at)
      : undefined,
  };
}
