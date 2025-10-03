import { HttpException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import typia, { tags } from "typia";
import { v4 } from "uuid";
import { MyGlobal } from "../MyGlobal";
import { PasswordUtil } from "../utils/PasswordUtil";
import { toISOStringSafe } from "../utils/toISOStringSafe";

import { ICommunityPlatformComment } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformComment";
import { IPageICommunityPlatformComment } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageICommunityPlatformComment";
import { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import { MemberPayload } from "../decorators/payload/MemberPayload";

export async function patchCommunityPlatformPostsPostIdComments(props: {
  member: MemberPayload;
  postId: string & tags.Format<"uuid">;
  body: ICommunityPlatformComment.IRequest;
}): Promise<IPageICommunityPlatformComment.ISparse> {
  const { member, postId, body } = props;

  const page = body.page ?? 1;
  const limit = body.limit ?? 20;
  const sort = body.sort || "newest";
  const parent_id = body.parent_id;

  const skip = (page - 1) * limit;

  // Validate post exists (may be deleted)
  await MyGlobal.prisma.community_platform_posts.findUniqueOrThrow({
    where: { id: postId, deleted_at: null },
  });

  // Build raw SQL query to fetch comments with all required data in single query
  // Join with member for display_name
  // Left join with comment_stats for score
  // Left join with comments to count replies
  const results = (await MyGlobal.prisma.$queryRaw`
    SELECT 
      c.id,
      c.post_id,
      c.author_id,
      c.parent_id,
      c.content,
      c.created_at,
      c.updated_at,
      m.display_name,
      cs.score,
      (
        SELECT COUNT(*)
        FROM community_platform_comments replies
        WHERE replies.parent_id = c.id
        AND replies.deleted_at IS NULL
      ) AS reply_count
    FROM community_platform_comments c
    LEFT JOIN community_platform_member m ON c.author_id = m.id AND m.deleted_at IS NULL
    LEFT JOIN community_platform_comment_stats cs ON c.id = cs.community_platform_comment_id
    WHERE c.post_id = ${postId}
    AND c.deleted_at IS NULL
    ${parent_id !== undefined && parent_id !== null ? "AND c.parent_id = ${parent_id}" : ""}
    ORDER BY 
      CASE 
        WHEN ${sort} = 'top' THEN cs.score 
        ELSE c.created_at 
      END DESC,
      c.created_at DESC,
      c.id DESC
    LIMIT ${limit} OFFSET ${skip}
  `) as any[];

  // Convert results to correct format
  const data = results.map((row: any) => ({
    id: row.id,
    post_id: row.post_id,
    author_id: row.author_id,
    parent_id: row.parent_id,
    content: row.content,
    created_at: toISOStringSafe(row.created_at),
    updated_at: row.updated_at ? toISOStringSafe(row.updated_at) : null,
    author_display_name: row.display_name,
    score: row.score || 0,
    reply_count: row.reply_count,
  }));

  // Get total count
  const total = (await MyGlobal.prisma.$queryRaw`
    SELECT COUNT(*) AS count
    FROM community_platform_comments c
    WHERE c.post_id = ${postId}
    AND c.deleted_at IS NULL
    ${parent_id !== undefined && parent_id !== null ? "AND c.parent_id = ${parent_id}" : ""}
  `) as any[];

  const totalCount = parseInt(total[0]?.count || "0", 10);

  return {
    pagination: {
      current: page,
      limit: limit,
      records: totalCount,
      pages: Math.ceil(totalCount / limit),
    },
    data,
  };
}
