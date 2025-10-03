import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { ICommunityPlatformCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunity";
import type { ICommunityPlatformCommunitySummary } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunitySummary";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageICommunityPlatformCommunitySummary } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageICommunityPlatformCommunitySummary";

export async function test_api_community_search_minimum_query(
  connection: api.IConnection,
) {
  // Create a community to ensure the search endpoint has data
  const communityName = RandomGenerator.alphaNumeric(6);
  const community: ICommunityPlatformCommunity =
    await api.functional.communityPlatform.member.communities.create(
      connection,
      {
        body: {
          name: communityName,
          category: "Tech & Programming",
        } satisfies ICommunityPlatformCommunity.ICreate,
      },
    );
  typia.assert(community);

  // Test with 1-character search query (should fail)
  await TestValidator.error(
    "1-character search query should fail",
    async () => {
      await api.functional.communityPlatform.communities.search(connection, {
        body: {
          search: "a", // Single character, violates minimum 2
        } satisfies ICommunityPlatformCommunity.IRequest,
      });
    },
  );

  // Test with 0-character search query (should fail)
  await TestValidator.error(
    "0-character search query should fail",
    async () => {
      await api.functional.communityPlatform.communities.search(connection, {
        body: {
          search: "", // Empty string, violates minimum 2
        } satisfies ICommunityPlatformCommunity.IRequest,
      });
    },
  );

  // Test with 2-character search query (should succeed)
  const searchResult: IPageICommunityPlatformCommunitySummary =
    await api.functional.communityPlatform.communities.search(connection, {
      body: {
        search: "ab", // Two characters, meets minimum requirement
      } satisfies ICommunityPlatformCommunity.IRequest,
    });
  typia.assert(searchResult);
  TestValidator.predicate(
    "search result has data",
    () => searchResult.data.length > 0,
  );
  // Verify the created community appears in search results
  TestValidator.predicate("search result contains created community", () =>
    searchResult.data.some((comm) => comm.name === communityName),
  );
}
