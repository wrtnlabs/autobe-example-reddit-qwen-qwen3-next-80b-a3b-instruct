import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ICommunitybbsPost } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsPost";
import { IPageICommunitybbsPost } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageICommunitybbsPost";

/**
 * Search and retrieve paginated posts from a specific community
 *
 * Retrieve an ordered and paginated list of posts from a specific community,
 * filtered by the provided search criteria. This operation supports advanced
 * filtering using the request body, including sort order (Newest or Top),
 * limit, offset, and text search. For the 'Newest' sort order, results are
 * sorted by creation_time descending, and then by post_id descending for ties.
 * For the 'Top' sort order, results are sorted by score (upvotes minus
 * downvotes) descending, followed by creation_time descending, and finally by
 * post_id descending. The operation only returns posts where deleted_at is
 * null, ensuring archived posts are excluded. The results are constructed by
 * querying the communitybbs_post table, using the communitybbs_community_id as
 * the filter, and joined with the communitybbs_vote table to compute scores.
 * The communitybbs_search_post table is not used here because this endpoint is
 * community-specific and does not require full-text search across the whole
 * platform — instead, it performs standard database queries optimized for range
 * and index scans on the community-specific post set. Pagination is implemented
 * via offset and limit, fetching exactly 20 posts per page as per requirements.
 * This endpoint must be accessible to all authenticated users and reflects the
 * user's joined community state — if the user has not joined the community, the
 * results are still accessible (read-only), matching the public nature of
 * community posts. No role restrictions are needed because posts within
 * communities are publicly readable by design.
 *
 * @param props - Request properties
 * @param props.communityId - Unique identifier of the community to retrieve
 *   posts from
 * @param props.body - Search criteria and pagination parameters for filtering
 *   posts within a community
 * @returns Paginated list of posts from the specified community, including
 *   score, author, creation time, and comment count
 */
export async function patchcommunitybbsCommunitiesCommunityIdPosts(props: {
  communityId: string & tags.Format<"uuid">;
  body: ICommunitybbsPost.IRequest;
}): Promise<IPageICommunitybbsPost> {
  const { communityId, body } = props;

  // Handle pagination parameters with defaults and bounds
  const page = body.page ?? 1;
  const limit = body.limit ?? 20;

  // Validate bounds
  const skip = Math.max(0, (page - 1) * limit);
  const take = Math.min(limit, 100);

  // Define sort order based on request
  const orderBy =
    body.sort === "Top"
      ? { score: "desc", created_at: "desc", id: "desc" }
      : { created_at: "desc", id: "desc" };

  // Query to get total count of posts in the community (active only)
  const totalCount = await MyGlobal.prisma.communitybbs_post.count({
    where: {
      communitybbs_community_id: communityId,
      deleted_at: null,
    },
  });

  // Use raw SQL to calculate scores with join and group by for performance
  // This avoids expensive multiple queries while maintaining accuracy
  // Note: We use Prisma's $queryRaw since we need a group by with aggregate
  const postsData = await MyGlobal.prisma.$queryRaw<ICommunitybbsPost[]>`
    SELECT 
      p.id,
      p.communitybbs_community_id,
      p.communitybbs_member_id,
      p.title,
      p.body,
      p.display_name,
      p.created_at,
      p.updated_at,
      p.deleted_at,
      COALESCE(SUM(
        CASE 
          WHEN v.type = 'upvote' THEN 1 
          WHEN v.type = 'downvote' THEN -1 
          ELSE 0 
        END
      ), 0) AS score
    FROM communitybbs_post p
    LEFT JOIN communitybbs_vote v ON p.id = v.post_id
    WHERE p.communitybbs_community_id = ${communityId}
      AND p.deleted_at IS NULL
    GROUP BY p.id, p.communitybbs_community_id, p.communitybbs_member_id, p.title, p.body, p.display_name, p.created_at, p.updated_at, p.deleted_at
    ORDER BY ${Prisma.raw(orderBy.score !== undefined ? "score DESC, created_at DESC, id DESC" : "created_at DESC, id DESC")}
    LIMIT ${take}
    OFFSET ${skip}
  `;

  // Convert all date fields to proper ISO strings
  const formattedPosts = postsData.map((post) => ({
    ...post,
    created_at: toISOStringSafe(post.created_at),
    updated_at: post.updated_at ? toISOStringSafe(post.updated_at) : undefined,
    deleted_at: post.deleted_at ? toISOStringSafe(post.deleted_at) : undefined,
  }));

  // Calculate total pages
  const totalPages = Math.ceil(totalCount / take);

  // Return paginated result
  return {
    pagination: {
      current: Number(page),
      limit: Number(take),
      records: totalCount,
      pages: totalPages,
    },
    data: formattedPosts,
  };
}
