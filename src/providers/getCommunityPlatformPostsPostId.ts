import { HttpException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import typia, { tags } from "typia";
import { v4 } from "uuid";
import { MyGlobal } from "../MyGlobal";
import { PasswordUtil } from "../utils/PasswordUtil";
import { toISOStringSafe } from "../utils/toISOStringSafe";

import { ICommunityPlatformPost } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformPost";

export async function getCommunityPlatformPostsPostId(props: {
  postId: string & tags.Format<"uuid">;
}): Promise<ICommunityPlatformPost> {
  const post = await MyGlobal.prisma.community_platform_posts.findUniqueOrThrow(
    {
      where: { id: props.postId, deleted_at: null },
    },
  );

  return {
    id: post.id,
    community_id: post.community_id,
    author_id: post.author_id,
    title: post.title,
    body: post.body,
    author_display_name: post.author_display_name,
    created_at: toISOStringSafe(post.created_at),
    updated_at: post.updated_at ? toISOStringSafe(post.updated_at) : undefined,
    deleted_at: post.deleted_at ? toISOStringSafe(post.deleted_at) : null,
  };
}
