import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunityPlatformCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunity";
import type { ICommunityPlatformMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformMember";
import type { IMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IMember";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageICommunityPlatformCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageICommunityPlatformCommunity";

export async function test_api_community_search_by_recently_created(
  connection: api.IConnection,
) {
  // Step 1: Authenticate as a member
  const memberEmail: string = typia.random<string & tags.Format<"email">>();
  const member: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: memberEmail,
        password_hash: "hashed_password_123",
      } satisfies IMember.IJoin,
    });
  typia.assert(member);

  // Step 2: Create multiple test communities with different creation timestamps
  // We'll create 5 communities with names that can be found in searches
  const communityNames = [
    "tech-talk",
    "design-thinking",
    "gaming-community",
    "coding-challenges",
    "health-and-wellness",
  ];

  const createdCommunities: ICommunityPlatformCommunity[] = [];

  // Create communities sequentially to ensure distinct creation timestamps
  for (const name of communityNames) {
    const community: ICommunityPlatformCommunity =
      await api.functional.communityPlatform.member.communities.create(
        connection,
        {
          body: {
            name, // Use generated community name
            category:
              name.includes("tech") || name.includes("coding")
                ? "Tech & Programming"
                : name.includes("design")
                  ? "Art & Design"
                  : name.includes("gaming")
                    ? "Games"
                    : "Lifestyle & Wellness",
          } satisfies ICommunityPlatformCommunity.ICreate,
        },
      );
    typia.assert(community);
    createdCommunities.push(community);
  }

  // Step 3: Test search with pagination and recentlyCreated sort
  // We'll verify the communities are sorted by creation timestamp descending

  // Search with minimum 2-character query ("te" to match "tech-talk" and "tech" category)
  const searchResult1: IPageICommunityPlatformCommunity =
    await api.functional.communityPlatform.search.sub_communities.search(
      connection,
      {
        body: {
          search: "te", // Minimum 2-character query
          sort: "recentlyCreated",
          page: 1,
          limit: 3,
        } satisfies ICommunityPlatformCommunity.IRequest,
      },
    );
  typia.assert(searchResult1);

  // Validate pagination metadata
  TestValidator.equals(
    "total count is correct",
    searchResult1.pagination.records,
    createdCommunities.length,
  );
  TestValidator.equals(
    "page limit is correct",
    searchResult1.pagination.limit,
    3,
  );
  TestValidator.equals(
    "current page is correct",
    searchResult1.pagination.current,
    1,
  );
  TestValidator.equals(
    "total pages calculation is correct",
    searchResult1.pagination.pages,
    Math.ceil(createdCommunities.length / 3),
  );

  // Validate that returned communities match the search criteria and are sorted by creation timestamp descending
  TestValidator.equals(
    "first community name contains 'te'",
    searchResult1.data[0].name.includes("te"),
    true,
  );

  // Verify communities are sorted by creation timestamp (newest first)
  // Since we created them sequentially, they should be in order of creation
  const sortedByCreation = [...createdCommunities].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  // Verify the first few results match the expected order
  TestValidator.equals(
    "first result matches newest community",
    searchResult1.data[0].id,
    sortedByCreation[0].id,
  );
  TestValidator.equals(
    "second result matches second newest",
    searchResult1.data[1].id,
    sortedByCreation[1].id,
  );
  TestValidator.equals(
    "third result matches third newest",
    searchResult1.data[2].id,
    sortedByCreation[2].id,
  );

  // Step 4: Test search on another page
  const searchResult2: IPageICommunityPlatformCommunity =
    await api.functional.communityPlatform.search.sub_communities.search(
      connection,
      {
        body: {
          search: "te",
          sort: "recentlyCreated",
          page: 2,
          limit: 3,
        } satisfies ICommunityPlatformCommunity.IRequest,
      },
    );
  typia.assert(searchResult2);

  // Verify we get the next communities in the sorted order
  if (sortedByCreation.length > 3) {
    TestValidator.equals(
      "fourth community in result",
      searchResult2.data[0].id,
      sortedByCreation[3].id,
    );
  }

  // Step 5: Test search with longer query ("coding")
  const searchResult3: IPageICommunityPlatformCommunity =
    await api.functional.communityPlatform.search.sub_communities.search(
      connection,
      {
        body: {
          search: "coding", // Longer query
          sort: "recentlyCreated",
          page: 1,
          limit: 5,
        } satisfies ICommunityPlatformCommunity.IRequest,
      },
    );
  typia.assert(searchResult3);

  // Verify result contains community with 'coding' in name
  TestValidator.predicate(
    "result includes coding community",
    searchResult3.data.some((c) => c.name === "coding-challenges"),
  );

  // Verify all results are sorted by creation timestamp descending
  const codingResults = searchResult3.data;
  const codingResultsSorted = [...codingResults].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  TestValidator.equals(
    "coding results sorted by creation",
    JSON.stringify(codingResults.map((c) => c.id)),
    JSON.stringify(codingResultsSorted.map((c) => c.id)),
  );

  // Step 6: Test search with no query to verify all communities appear sorted by creation
  const searchResult4: IPageICommunityPlatformCommunity =
    await api.functional.communityPlatform.search.sub_communities.search(
      connection,
      {
        body: {
          sort: "recentlyCreated",
          page: 1,
          limit: 10,
        } satisfies ICommunityPlatformCommunity.IRequest,
      },
    );
  typia.assert(searchResult4);

  // Validate all communities are returned sorted by creation time descending
  TestValidator.equals(
    "all communities returned",
    searchResult4.pagination.records,
    createdCommunities.length,
  );
  TestValidator.equals(
    "all communities sorted by creation",
    JSON.stringify(searchResult4.data.map((c) => c.id)),
    JSON.stringify(sortedByCreation.map((c) => c.id)),
  );

  // Step 7: Verify search works without membership - create new connection without authentication
  const unauthConnection: api.IConnection = { ...connection, headers: {} };

  const searchResult5: IPageICommunityPlatformCommunity =
    await api.functional.communityPlatform.search.sub_communities.search(
      unauthConnection, // Unauthenticated connection
      {
        body: {
          search: "te",
          sort: "recentlyCreated",
          page: 1,
          limit: 5,
        } satisfies ICommunityPlatformCommunity.IRequest,
      },
    );
  typia.assert(searchResult5);

  // Verify unauthenticated search returns the same data as authenticated search
  TestValidator.equals(
    "unauth search returns same sorted data",
    JSON.stringify(searchResult5.data.map((c) => c.id)),
    JSON.stringify(searchResult1.data.map((c) => c.id)),
  );

  // Step 8: Test edge case - search with exactly 2 characters (minimum required)
  const searchResult6: IPageICommunityPlatformCommunity =
    await api.functional.communityPlatform.search.sub_communities.search(
      connection,
      {
        body: {
          search: "te", // Exactly 2 characters, minimum required
          sort: "recentlyCreated",
          page: 1,
          limit: 5,
        } satisfies ICommunityPlatformCommunity.IRequest,
      },
    );
  typia.assert(searchResult6);

  // No specific assertion needed here as already exercised above, but the call itself validates the minimum length requirement

  // Step 9: Test pagination with limit = 1 (minimum possible)
  const searchResult7: IPageICommunityPlatformCommunity =
    await api.functional.communityPlatform.search.sub_communities.search(
      connection,
      {
        body: {
          search: "te",
          sort: "recentlyCreated",
          page: 1,
          limit: 1,
        } satisfies ICommunityPlatformCommunity.IRequest,
      },
    );
  typia.assert(searchResult7);

  TestValidator.equals(
    "limit of 1 returns single result",
    searchResult7.data.length,
    1,
  );
  TestValidator.equals(
    "first result when limit=1 is the newest",
    searchResult7.data[0].id,
    sortedByCreation[0].id,
  );

  // Step 10: Test that communities without membership are returned
  // Since we created communities with one member (the creator) and never joined any other community,
  // the search results include communities that the current user has joined (the ones they created)
  // but this test confirms that communities can be found even if not joined
  // We've already verified this because the search results include communities we created

  // Verify we can search for a community name that doesn't match the user's joined communities (though we created all of them)
  // The key point is that search doesn't filter by membership; we've verified this by returning the same result with authenticated and unauthenticated users

  // Final verification: All created communities are discoverable in search
  // with 'recentlyCreated' sort and proper pagination
  TestValidator.equals(
    "all created communities are discoverable",
    searchResult4.pagination.records,
    createdCommunities.length,
  );
}
