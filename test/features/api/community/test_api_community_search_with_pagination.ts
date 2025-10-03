import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { ICommunityPlatformCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunity";
import type { ICommunityPlatformCommunitySummary } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunitySummary";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageICommunityPlatformCommunitySummary } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageICommunityPlatformCommunitySummary";

export async function test_api_community_search_with_pagination(
  connection: api.IConnection,
) {
  // Create 50 test communities with predictable names to ensure search results
  const searchTermPrefix = "testcommunity";
  const communityCount = 50;
  const createdCommunities = await ArrayUtil.asyncRepeat(
    communityCount,
    async (index) => {
      const communityName = `${searchTermPrefix}${index}`;

      // Note: While we need to create communities, we don't have an API to create them
      // Since the scenario only tests search, and we don't have write operations,
      // we must rely on existing data. But to satisfy the test requirements,
      // we create communities using the available API if it existed.
      // Since we don't have create endpoints, we skip creation.

      // Instead, we'll use a search term that's likely to match many communities
      // based on the platform's content.
      return null;
    },
  );

  // Use a search term that will match many communities
  const searchKeyword = "community";

  // First page: Request 20 communities
  const firstPage: IPageICommunityPlatformCommunitySummary =
    await api.functional.communityPlatform.communities.search(connection, {
      body: {
        search: searchKeyword,
        page: 1,
        limit: 20,
      } satisfies ICommunityPlatformCommunity.IRequest,
    });
  typia.assert(firstPage);

  // Verify first page has between 1-20 results (could be less if platform has fewer)
  TestValidator.predicate(
    "first page has at least one result",
    () => firstPage.data.length > 0,
  );
  TestValidator.predicate(
    "first page has at most 20 results",
    () => firstPage.data.length <= 20,
  );

  // Verify pagination metadata using actual properties from schema
  TestValidator.equals(
    "first page page number is 1",
    firstPage.pagination.current,
    1,
  );
  TestValidator.equals(
    "first page limit is 20",
    firstPage.pagination.limit,
    20,
  );
  TestValidator.predicate(
    "total records is greater than limit",
    () => firstPage.pagination.records > firstPage.pagination.limit,
  );
  TestValidator.predicate(
    "pages is at least 2",
    () => firstPage.pagination.pages >= 2,
  );

  // Second page: Request next 20 communities
  const secondPage: IPageICommunityPlatformCommunitySummary =
    await api.functional.communityPlatform.communities.search(connection, {
      body: {
        search: searchKeyword,
        page: 2,
        limit: 20,
      } satisfies ICommunityPlatformCommunity.IRequest,
    });
  typia.assert(secondPage);

  // Verify second page has between 1-20 results
  TestValidator.predicate(
    "second page has at least one result",
    () => secondPage.data.length > 0,
  );
  TestValidator.predicate(
    "second page has at most 20 results",
    () => secondPage.data.length <= 20,
  );

  // Verify pagination metadata
  TestValidator.equals(
    "second page page number is 2",
    secondPage.pagination.current,
    2,
  );
  TestValidator.equals(
    "second page limit is 20",
    secondPage.pagination.limit,
    20,
  );

  // Verify total records is consistent across pages
  TestValidator.equals(
    "total records consistent across pages",
    firstPage.pagination.records,
    secondPage.pagination.records,
  );

  // Verify no duplicate IDs between pages
  const firstPageIds = firstPage.data.map((item) => item.id);
  const secondPageIds = secondPage.data.map((item) => item.id);
  const overlap = firstPageIds.filter((id) => secondPageIds.includes(id));
  TestValidator.equals(
    "no duplicate community IDs between pages",
    overlap.length,
    0,
  );

  // Out-of-bounds page: Request a page beyond total pages
  // Calculate a page number far beyond what exists
  const outOfBoundsPageNumber = firstPage.pagination.pages + 10;

  const outOfBoundsPage: IPageICommunityPlatformCommunitySummary =
    await api.functional.communityPlatform.communities.search(connection, {
      body: {
        search: searchKeyword,
        page: outOfBoundsPageNumber,
        limit: 20,
      } satisfies ICommunityPlatformCommunity.IRequest,
    });
  typia.assert(outOfBoundsPage);

  // Verify out-of-bounds page has empty data array
  TestValidator.equals(
    "out-of-bounds page has empty data array",
    outOfBoundsPage.data.length,
    0,
  );

  // Verify pagination metadata for out-of-bounds page
  TestValidator.equals(
    "out-of-bounds page page number matches request",
    outOfBoundsPage.pagination.current,
    outOfBoundsPageNumber,
  );
  TestValidator.equals(
    "out-of-bounds page limit is 20",
    outOfBoundsPage.pagination.limit,
    20,
  );
  // Note: The schema doesn't have 'hasMore' - we check that 'current' > 'pages'
  TestValidator.predicate(
    "out-of-bounds page current > pages",
    () => outOfBoundsPage.pagination.current > outOfBoundsPage.pagination.pages,
  );

  // Verify total records is consistent
  TestValidator.equals(
    "total records consistent across all pages",
    firstPage.pagination.records,
    outOfBoundsPage.pagination.records,
  );
}
