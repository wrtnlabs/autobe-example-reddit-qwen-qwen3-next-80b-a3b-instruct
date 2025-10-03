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

export async function postCommunityPlatformMemberPosts({
  member,
  body,
}: {
  member: MemberPayload;
  body: ICommunityPlatformPost.ICreate;
}): Promise<ICommunityPlatformPost> {
  const created = await MyGlobal.prisma.community_platform_posts.create({
    data: {
      id: v4(),
      community_id: body.community_id,
      author_id: member.id,
      title: body.title,
      body: body.body,
      author_display_name: body.author_display_name,
      created_at: toISOStringSafe(new Date()),
      updated_at: toISOStringSafe(new Date()),
      deleted_at: null,
    },
  });

  return {
    id: created.id,
    community_id: created.community_id,
    author_id: created.author_id,
    title: created.title,
    body: created.body,
    author_display_name: created.author_display_name,
    created_at: toISOStringSafe(created.created_at),
    updated_at: created.updated_at
      ? toISOStringSafe(created.updated_at)
      : undefined,
    deleted_at: created.deleted_at ? toISOStringSafe(created.deleted_at) : null,
  };
}
