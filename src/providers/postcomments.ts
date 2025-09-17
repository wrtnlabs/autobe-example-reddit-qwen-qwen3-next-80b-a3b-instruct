import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IComment } from "@ORGANIZATION/PROJECT-api/lib/structures/IComment";
import { MemberPayload } from "../decorators/payload/MemberPayload";

export async function postcomments(props: {
  member: MemberPayload;
  body: IComment.ICreate;
}): Promise<IComment> {
  // Get member's display_name from database
  const member = await MyGlobal.prisma.communitybbs_member.findUniqueOrThrow({
    where: { id: props.member.id },
  });

  // Create the comment with all required fields
  const created = await MyGlobal.prisma.communitybbs_comment.create({
    data: {
      id: v4() as string & tags.Format<"uuid">,
      communitybbs_post_id: props.body.communitybbs_post_id,
      communitybbs_member_id: props.member.id,
      communitybbs_comment_id: props.body.communitybbs_comment_id,
      content: props.body.content,
      created_at: toISOStringSafe(new Date()),
      updated_at: toISOStringSafe(new Date()),
      deleted_at: null,
    },
    select: {
      id: true,
      communitybbs_post_id: true,
      communitybbs_member_id: true,
      communitybbs_comment_id: true,
      content: true,
      created_at: true,
      updated_at: true,
      deleted_at: true,
    },
  });

  // Map the database record to IComment interface
  return {
    id: created.id,
    postId: created.communitybbs_post_id,
    author: member.display_name,
    parentId: created.communitybbs_comment_id,
    content: created.content,
    created_at: created.created_at,
    updated_at: created.updated_at,
    deleted_at: created.deleted_at,
  };
}
