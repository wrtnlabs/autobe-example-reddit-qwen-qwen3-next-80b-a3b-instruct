import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { ICommunityPlatformCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunity";
import type { ICommunityPlatformCommunitySummary } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunitySummary";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageICommunityPlatformCommunitySummary } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageICommunityPlatformCommunitySummary";

export async function test_api_community_search_by_name(
  connection: api.IConnection,
) {
  // Test search term with minimum 2 characters
  const validSearch = "tech";

  // Perform search with valid 2-character search term
  const result = await api.functional.communityPlatform.communities.search(
    connection,
    {
      body: {
        search: validSearch,
      } satisfies ICommunityPlatformCommunity.IRequest,
    },
  );
  typia.assert(result);

  // Verify that the response structure is correct
  TestValidator.equals(
    "response has pagination property",
    result.hasOwnProperty("pagination"),
    true,
  );
  TestValidator.equals(
    "response has data property",
    result.hasOwnProperty("data"),
    true,
  );

  // Test that search fails with less than 2 characters
  await TestValidator.error(
    "search must require at least 2 characters",
    async () => {
      await api.functional.communityPlatform.communities.search(connection, {
        body: {
          search: "t", // 1 character - should fail
        } satisfies ICommunityPlatformCommunity.IRequest,
      });
    },
  );

  // Test search with another valid 2-character term
  const anotherResult =
    await api.functional.communityPlatform.communities.search(connection, {
      body: {
        search: "sci", // valid search term
      } satisfies ICommunityPlatformCommunity.IRequest,
    });
  typia.assert(anotherResult);

  // Test search without any search term (should return all communities)
  const allCommunities =
    await api.functional.communityPlatform.communities.search(connection, {
      body: {} satisfies ICommunityPlatformCommunity.IRequest,
    });
  typia.assert(allCommunities);

  // Test search with category filter - validating the enum values
  const techCategory =
    await api.functional.communityPlatform.communities.search(connection, {
      body: {
        category: "Tech & Programming",
      } satisfies ICommunityPlatformCommunity.IRequest,
    });
  typia.assert(techCategory);

  // Test with another category
  const gameCategory =
    await api.functional.communityPlatform.communities.search(connection, {
      body: {
        category: "Games",
      } satisfies ICommunityPlatformCommunity.IRequest,
    });
  typia.assert(gameCategory);

  // Test sort parameter
  const nameMatchSort =
    await api.functional.communityPlatform.communities.search(connection, {
      body: {
        search: "tech",
        sort: "nameMatch",
      } satisfies ICommunityPlatformCommunity.IRequest,
    });
  typia.assert(nameMatchSort);

  const recentlyCreatedSort =
    await api.functional.communityPlatform.communities.search(connection, {
      body: {
        search: "tech",
        sort: "recentlyCreated",
      } satisfies ICommunityPlatformCommunity.IRequest,
    });
  typia.assert(recentlyCreatedSort);

  // Test pagination parameters
  const pageOne = await api.functional.communityPlatform.communities.search(
    connection,
    {
      body: {
        page: 1,
        limit: 5,
      } satisfies ICommunityPlatformCommunity.IRequest,
    },
  );
  typia.assert(pageOne);
  TestValidator.equals("page 1 has limit 5", pageOne.pagination.limit, 5);

  const pageTwo = await api.functional.communityPlatform.communities.search(
    connection,
    {
      body: {
        page: 2,
        limit: 5,
      } satisfies ICommunityPlatformCommunity.IRequest,
    },
  );
  typia.assert(pageTwo);
  TestValidator.equals("page 2 has limit 5", pageTwo.pagination.limit, 5);

  // Test limit maximum (50)
  const maxLimit = await api.functional.communityPlatform.communities.search(
    connection,
    {
      body: {
        limit: 50,
      } satisfies ICommunityPlatformCommunity.IRequest,
    },
  );
  typia.assert(maxLimit);

  // Test limit above maximum (should work in server but we can't test error without knowing if API validates it)
  // However, since we don't know if API validates limit > 50, we cannot test for error condition
  // as per rules: don't test type errors or validation errors unless explicitly defined in server code
  // Since documentation says clients must not exceed 50, but doesn't say server will reject,
  // we don't test rejection for limit > 50
}
