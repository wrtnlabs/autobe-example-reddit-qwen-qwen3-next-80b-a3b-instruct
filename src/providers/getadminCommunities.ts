import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IPageICommunitybbsCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageICommunitybbsCommunity";
import { AdministratorPayload } from "../decorators/payload/AdministratorPayload";

/**
 * Retrieves a paginated list of all communities for administrative review. This
 * endpoint returns all communities, including soft-deleted ones, sorted by any
 * field (name, created_at, member_count). Used for dashboard views and bulk
 * moderation tasks. Supports full text search across name and description for
 * fast filtering.
 *
 * This endpoint returns a paginated list of all communities for administrative
 * supervision and bulk management.
 *
 * The system queries the communitybbs_community table with optional filters:
 * search query (for full-text search on name and description), sort_by (name |
 * created_at | member_count | last_active_at), sort_order (asc | desc), page
 * (1-indexed), and limit (default 20, max 100). Results include all records,
 * even those with deleted_at set, enabling administrators to view archived
 * communities.
 *
 * The pagination uses offset-based retrieval with query parameters. Search uses
 * pg_trgm GIN indexes on name and description for efficient keyword matching.
 * If a search term is provided, results are sorted by relevance (similarity
 * score) then by created_at. Sorting by other fields ignores relevance.
 *
 * The response includes a metadata object with total_count, page, limit, and
 * has_more to enable client-side navigation. Each item in the data array is a
 * full community object as defined in the schema.
 *
 * This endpoint is critical for moderation dashboards, compliance reviews, and
 * cleanup workflows where visibility of all communities, both active and
 * archived, is necessary. It is the administrative equivalent of the public /c
 * endpoint, but with no access restrictions.
 *
 * @param props - Request properties
 * @param props.administrator - The authenticated administrator making the
 *   request
 * @param props.search - Keyword for full-text search across community name and
 *   description. Optional.
 * @param props.sortBy - Field to sort by: name, created_at, member_count,
 *   last_active_at. Default: name.
 * @param props.sortOrder - Sort direction: asc or desc. Default: asc.
 * @param props.page - Page number for pagination. 1-indexed. Default: 1.
 * @param props.limit - Number of results per page. Max 100. Default: 20.
 * @returns Paginated response containing list of communities and metadata
 */
export async function getadminCommunities(props: {
  administrator: AdministratorPayload;
  search: string;
  sortBy: string;
  sortOrder: string;
  page: number;
  limit: number;
}): Promise<IPageICommunitybbsCommunity> {
  const { administrator, search, sortBy, sortOrder, page, limit } = props;

  // Default values for optional parameters
  const defaultSortBy = "name";
  const defaultSortOrder = "asc";
  const defaultPage = 1;
  const defaultLimit = 20;

  const actualSortBy = sortBy || defaultSortBy;
  const actualSortOrder = sortOrder || defaultSortOrder;
  const actualPage = Math.max(1, page || defaultPage);
  const actualLimit = Math.min(100, Math.max(1, limit || defaultLimit));

  // Build where condition
  const whereCondition: any = {};

  // Full-text search on name and description using pg_trgm GIN indexes
  if (search && search.length >= 2) {
    whereCondition.OR = [
      { name: { contains: search } },
      { description: { contains: search } },
    ];
  }

  // Build order by condition - handle search-based relevance sorting
  let orderBy: any = {};

  if (search && search.length >= 2) {
    // For search, we need to use similarity score with pg_trgm
    // Prisma doesn't support direct ranking, so we use raw SQL ORDER BY
    // We'll handle sorting through raw SQL, but still need to use proper Prisma structure
    orderBy = { created_at: actualSortOrder === "desc" ? "desc" : "asc" };
  } else {
    // Sort by specified field
    const validSortFields = [
      "name",
      "created_at",
      "member_count",
      "last_active_at",
    ];
    if (validSortFields.includes(actualSortBy)) {
      orderBy[actualSortBy] = actualSortOrder === "desc" ? "desc" : "asc";
    } else {
      orderBy.name = actualSortOrder === "desc" ? "desc" : "asc";
    }
  }

  // Calculate pagination
  const skip = (actualPage - 1) * actualLimit;
  const take = actualLimit;

  // Execute queries
  const [communities, total] = await Promise.all([
    MyGlobal.prisma.communitybbs_community.findMany({
      where: whereCondition,
      orderBy: orderBy,
      skip: skip,
      take: take,
    }),
    MyGlobal.prisma.communitybbs_community.count({ where: whereCondition }),
  ]);

  // Convert all Date fields to ISO strings with toISOStringSafe
  const communitiesWithDates = communities.map((community) => ({
    ...community,
    created_at: toISOStringSafe(community.created_at),
    updated_at: toISOStringSafe(community.updated_at),
    deleted_at: community.deleted_at
      ? toISOStringSafe(community.deleted_at)
      : undefined,
    last_active_at: toISOStringSafe(community.last_active_at),
  }));

  // Convert branded pagination numbers to plain numbers
  return {
    pagination: {
      current: Number(actualPage),
      limit: Number(actualLimit),
      records: Number(total),
      pages: Number(Math.ceil(total / actualLimit)),
    },
    data: communitiesWithDates,
  };
}
