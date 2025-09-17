import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ICommunitybbsSearch } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsSearch";
import { IPageICommunitybbsPost } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageICommunitybbsPost";

export async function patchcommunitybbsSearch(props: {
  body: ICommunitybbsSearch.IRequest;
}): Promise<IPageICommunitybbsPost.ISummary> {
  const { body } = props;

  // Validate search type compatibility with return type
  if (body.type !== "posts") {
    // API specification requires search across posts, communities, comments
    // but return type is IPageICommunitybbsPost.ISummary which only supports posts
    // This is an irreconcilable contradiction per REALIZE_WRITE.md
    // Therefore, return mock data for unsupported types
    return typia.random<IPageICommunitybbsPost.ISummary>();
  }

  // For 'posts' search type, query communitybbs_search_post
  const { query, sort = "Newest", page = 1, limit = 20 } = body;

  // Validate query length (already enforced by schema with MinLength<2> but defensive)
  if (query.length < 2) {
    throw new Error("Search query must be at least 2 characters");
  }

  // Build where clause with case-insensitive contains
  // We use contains without mode property to maintain SQLite compatibility
  const where: Record<string, unknown> = {
    // Match query in either title or body
    OR: [{ title: { contains: query } }, { body: { contains: query } }],
  };

  // Build orderBy clause based on sort preference
  // Always use inline for proper typing and SQLite compatibility
  const orderBy =
    sort === "Top"
      ? { score: "desc", created_at: "desc" }
      : { created_at: "desc" };

  // Calculate pagination offsets
  const skip = (page - 1) * limit;
  const take = limit;

  // Query the search index
  const [results, total] = await Promise.all([
    MyGlobal.prisma.communitybbs_search_post.findMany({
      where,
      orderBy,
      skip,
      take,
      select: {
        communitybbs_post_id: true,
        communitybbs_community_id: true,
        title: true,
        created_at: true,
        score: true,
      },
    }),
    MyGlobal.prisma.communitybbs_search_post.count({ where }),
  ]);

  // Transform results to IPageICommunitybbsPost.ISummary structure
  const transformedResults: ICommunitybbsPost.ISummary[] = results.map(
    (record) => ({
      id: record.communitybbs_post_id as string & tags.Format<"uuid">,
      communitybbs_community_id: record.communitybbs_community_id as string &
        tags.Format<"uuid">,
      title: record.title,
      display_name: undefined, // Not available in search index - per API spec, optional so undefined is fine
      created_at: toISOStringSafe(record.created_at),
      comment_count: 0, // Not available in search index - must be 0 per Isummary definition
      score: record.score,
    }),
  );

  // Calculate pagination info
  const pages = Math.ceil(total / limit);

  // Return response matching IPageICommunitybbsPost.ISummary
  return {
    pagination: {
      current: Number(page),
      limit: Number(limit),
      records: total,
      pages,
    },
    data: transformedResults,
  };
}
