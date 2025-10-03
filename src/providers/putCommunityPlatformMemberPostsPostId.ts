import { HttpException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import typia, { tags } from "typia";
import { v4 } from "uuid";
import { MyGlobal } from "../MyGlobal";
import { PasswordUtil } from "../utils/PasswordUtil";
import { toISOStringSafe } from "../utils/toISOStringSafe";

import { ICommunityPlatformPost } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformPost";
import { MemberPayload } from "../decorators/payload/MemberPayload";

export async function putCommunityPlatformMemberPostsPostId(props: {
  member: MemberPayload;
  postId: string & tags.Format<"uuid">;
  body: ICommunityPlatformPost.IUpdate;
}): Promise<ICommunityPlatformPost> {
  const post = await MyGlobal.prisma.community_platform_posts.findUniqueOrThrow(
    {
      where: { id: props.postId },
    },
  );

  if (post.author_id !== props.member.id) {
    throw new HttpException("You can only edit posts you created.", 403);
  }

  if (post.deleted_at !== null) {
    throw new HttpException("Post not found.", 404);
  }

  const updated = await MyGlobal.prisma.community_platform_posts.update({
    where: { id: props.postId },
    data: {
      title:
        props.body.title !== undefined && props.body.title !== null
          ? props.body.title
          : post.title,
      body:
        props.body.body !== undefined && props.body.body !== null
          ? props.body.body
          : post.body,
      updated_at: toISOStringSafe(new Date()),
    },
  });

  return {
    id: updated.id,
    community_id: updated.community_id,
    author_id: updated.author_id,
    title: updated.title,
    body: updated.body,
    author_display_name: updated.author_display_name,
    created_at: toISOStringSafe(updated.created_at),
    updated_at: toISOStringSafe(updated.updated_at),
    deleted_at: updated.deleted_at
      ? toISOStringSafe(updated.deleted_at)
      : undefined,
  };
}
