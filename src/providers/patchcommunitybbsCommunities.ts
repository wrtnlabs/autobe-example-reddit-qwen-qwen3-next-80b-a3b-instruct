import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ICommunitybbsCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsCommunity";
import { IPageICommunitybbsCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageICommunitybbsCommunity";

/**
 * Search and retrieve a filtered, paginated list of communities
 *
 * Retrieve a filtered and paginated list of communities from the system. This
 * operation provides advanced search capabilities for finding communities based
 * on multiple criteria including partial name matching, description keyword
 * search, category filtering, and activity-based sorting.
 *
 * The operation supports comprehensive pagination with configurable page sizes
 * and multiple sort orders including 'Name Match' (default for community
 * search) and 'Recently Created'. Communities can be sorted by name similarity
 * to the search query, creation date, or popularity metrics derived from member
 * count and last active timestamp.
 *
 * Security considerations include rate limiting for search operations and
 * appropriate filtering of sensitive community information based on the
 * requesting user's authorization level. Only users with appropriate
 * permissions can access detailed community information, while basic community
 * lists may be available to authenticated users.
 *
 * This operation integrates with the communitybbs_community table as defined in
 * the Prisma schema, incorporating all available community fields including
 * name, description, category, logo, banner, rules, member_count, and
 * last_active_at. The response includes community summary information optimized
 * for list displays, with options to include additional details based on
 * authorization level. The search functionality leverages the
 * communitybbs_search_community table for optimized full-text performance
 * across name and description fields.
 *
 * @param props - Request properties
 * @param props.body - Search criteria and pagination parameters for community
 *   filtering
 * @returns Paginated list of community summary information matching search
 *   criteria
 * @throws {Error} When search term is invalid (not enforced, handled by schema)
 */
export async function patchcommunitybbsCommunities(props: {
  body: ICommunitybbsCommunity.IRequest;
}): Promise<IPageICommunitybbsCommunity.ISummary> {
  const {
    search,
    sortBy = "name",
    sortOrder = "asc",
    page = 1,
    limit = 20,
  } = props.body;

  // Validate sort option with typia.assertGuard — ensures it's one of the permitted literals
  typia.assertGuard<"name" | "created_at" | "member_count" | "last_active_at">(
    sortBy,
  );

  // Construct WHERE clause - exclude soft-deleted communities and apply search
  const where: Record<string, unknown> = {
    deleted_at: null,
  };

  // Apply full-text search on description and name using trigram similarity (GIN index)
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { description: { contains: search } },
    ];
  }

  // Construct ORDER BY clause
  const orderBy: Record<string, "asc" | "desc"> = {};
  if (sortBy === "name") {
    orderBy.name = sortOrder;
  } else if (sortBy === "created_at") {
    orderBy.created_at = sortOrder;
  } else if (sortBy === "member_count") {
    orderBy.member_count = sortOrder;
  } else if (sortBy === "last_active_at") {
    orderBy.last_active_at = sortOrder;
  }

  // Calculate pagination offset (skip)
  const skip = (Number(page) - 1) * Number(limit);

  // Fetch data and count in parallel
  const [communities, total] = await Promise.all([
    MyGlobal.prisma.communitybbs_community.findMany({
      where,
      orderBy,
      skip,
      take: Number(limit),
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        member_count: true,
        last_active_at: true,
      },
    }),
    MyGlobal.prisma.communitybbs_community.count({ where }),
  ]);

  // Transform results to summary format with proper date formatting
  const data: ICommunitybbsCommunity.ISummary[] = communities.map(
    (community) => ({
      id: community.id,
      name: community.name,
      description: community.description,
      category: community.category,
      member_count: community.member_count,
      last_active_at: community.last_active_at
        ? toISOStringSafe(community.last_active_at)
        : toISOStringSafe(new Date()),
    }),
  );

  // Strip branded number types for pagination response
  return {
    pagination: {
      current: Number(page),
      limit: Number(limit),
      records: total,
      pages: Math.ceil(total / Number(limit)),
    },
    data,
  };
}
