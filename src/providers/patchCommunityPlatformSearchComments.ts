import { HttpException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import typia, { tags } from "typia";
import { v4 } from "uuid";
import { MyGlobal } from "../MyGlobal";
import { PasswordUtil } from "../utils/PasswordUtil";
import { toISOStringSafe } from "../utils/toISOStringSafe";

import { ICommunityPlatformSearchComment } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformSearchComment";
import { IPageICommunityPlatformSearchComment } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageICommunityPlatformSearchComment";
import { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";

export async function patchCommunityPlatformSearchComments(props: {
  body: ICommunityPlatformSearchComment.IRequest;
}): Promise<IPageICommunityPlatformSearchComment> {
  const { q, page = 1, limit = 20 } = props.body;

  // Validate query term
  const trimmedQ = q.trim();
  if (!trimmedQ) {
    throw new HttpException("Bad Request: Query term 'q' is required", 400);
  }

  if (trimmedQ.length < 2) {
    throw new HttpException(
      "Bad Request: Search term must be at least 2 characters",
      400,
    );
  }

  // Enforce valid limits
  const safeLimit = Math.min(Math.max(1, limit), 50);
  const safePage = Math.max(1, page);
  const skip = (safePage - 1) * safeLimit;

  // Search for comments using text search
  const results =
    await MyGlobal.prisma.community_platform_search_comments.findMany({
      where: {
        content: { contains: trimmedQ },
      },
      orderBy: {
        created_at: "desc",
      },
      skip,
      take: safeLimit,
    });

  // Count total matching records
  const total = await MyGlobal.prisma.community_platform_search_comments.count({
    where: {
      content: { contains: trimmedQ },
    },
  });

  // Convert date fields to proper types and construct results
  const data: ICommunityPlatformSearchComment[] = results.map((comment) => ({
    id: comment.id,
    comment_id: comment.comment_id,
    post_id: comment.post_id,
    community_id: comment.community_id,
    content: comment.content,
    author_name: comment.author_name,
    score: comment.score,
    created_at: toISOStringSafe(comment.created_at),
    updated_at: toISOStringSafe(comment.updated_at),
  }));

  // Build pagination object - strip branded types with Number()
  const pagination: IPage.IPagination = {
    current: Number(safePage),
    limit: Number(safeLimit),
    records: Number(total),
    pages: Number(Math.ceil(total / safeLimit)),
  };

  return {
    pagination,
    data,
  };
}
