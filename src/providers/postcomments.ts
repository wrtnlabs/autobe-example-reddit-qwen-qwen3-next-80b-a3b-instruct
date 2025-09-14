import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IComment } from "@ORGANIZATION/PROJECT-api/lib/structures/IComment";
import { MemberPayload } from "../decorators/payload/MemberPayload";

/**
 * Create a new comment on a post.
 *
 * This endpoint allows an authenticated member to post a new comment on a
 * specific post. The comment is linked to the target post via postId.
 * Optionally, it can be a reply to an existing comment via parentId. The
 * author's display name is taken from their profile at the time of creation for
 * consistency. The comment is created with active status (deleted_at is null).
 *
 * @param props - Request properties
 * @param props.member - The authenticated member creating the comment
 * @param props.body - The comment creation request body containing the post ID,
 *   optional parent comment ID, and content
 * @returns The newly created comment with all fields populated including id,
 *   postId, author, content, and timestamps
 * @throws {Error} When the target post or parent comment doesn't exist (Prisma
 *   throws)
 */
export async function postcomments(props: {
  member: MemberPayload;
  body: IComment.ICreate;
}): Promise<IComment> {
  const { member, body } = props;

  const memberRecord =
    await MyGlobal.prisma.communitybbs_member.findUniqueOrThrow({
      where: { id: member.id },
    });

  const created = await MyGlobal.prisma.communitybbs_comment.create({
    data: {
      id: v4() as string & tags.Format<"uuid">,
      communitybbs_post_id: body.communitybbs_post_id,
      communitybbs_comment_id: body.communitybbs_comment_id,
      content: body.content,
      display_name: body.display_name ?? memberRecord.display_name,
      created_at: toISOStringSafe(new Date()),
      updated_at: toISOStringSafe(new Date()),
      deleted_at: null,
    },
  });

  return {
    id: created.id,
    postId: created.communitybbs_post_id,
    author: created.display_name,
    parentId: created.communitybbs_comment_id,
    content: created.content,
    created_at: toISOStringSafe(created.created_at),
    updated_at: created.updated_at
      ? toISOStringSafe(created.updated_at)
      : undefined,
    deleted_at: created.deleted_at ? toISOStringSafe(created.deleted_at) : null,
  };
}
