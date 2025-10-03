import { HttpException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import typia, { tags } from "typia";
import { v4 } from "uuid";
import { MyGlobal } from "../MyGlobal";
import { PasswordUtil } from "../utils/PasswordUtil";
import { toISOStringSafe } from "../utils/toISOStringSafe";

import { ICommunityPlatformComment } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformComment";
import { MemberPayload } from "../decorators/payload/MemberPayload";

export async function postCommunityPlatformMemberPostsPostIdComments(props: {
  member: MemberPayload;
  postId: string & tags.Format<"uuid">;
  body: ICommunityPlatformComment.ICreate;
}): Promise<ICommunityPlatformComment.ISparse> {
  // Fetch the post to ensure it exists and is not deleted
  const post = await MyGlobal.prisma.community_platform_posts.findUniqueOrThrow(
    {
      where: { id: props.postId },
    },
  );

  // Get the member's display name
  const member =
    await MyGlobal.prisma.community_platform_member.findUniqueOrThrow({
      where: { id: props.member.id },
    });

  // Create the comment
  const comment = await MyGlobal.prisma.community_platform_comments.create({
    data: {
      id: v4() as string & tags.Format<"uuid">,
      post_id: props.postId,
      author_id: props.member.id,
      parent_id:
        props.body.parent_id === undefined ? null : props.body.parent_id,
      content: props.body.content,
      created_at: toISOStringSafe(new Date()),
      updated_at: toISOStringSafe(new Date()),
    },
  });

  // Return the sparse comment object
  // reply_count is 0 for replies (parent_id exists), undefined for top-level comments (parent_id null)
  // The database has no reply_count field - this is purely a presentation field in the API response
  return {
    id: comment.id,
    post_id: comment.post_id,
    author_id: comment.author_id,
    parent_id: comment.parent_id,
    content: comment.content,
    created_at: toISOStringSafe(comment.created_at),
    updated_at: toISOStringSafe(comment.updated_at),
    author_display_name: member.display_name ?? null,
    score: 0,
    reply_count: comment.parent_id === null ? undefined : 0,
  };
}
