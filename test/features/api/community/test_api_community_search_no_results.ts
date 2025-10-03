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

export async function test_api_community_search_no_results(
  connection: api.IConnection,
) {
  // Authenticate member to create community
  const memberEmail = typia.random<string & tags.Format<"email">>();
  const memberPassword = "password123";

  // Simulate a bcrypt hash of the password (this is a simplified placeholder for test purposes)
  // In a real application, this would come from using a bcrypt library to hash the password
  // For test purposes, we'll use a known hash format used in test environments
  const passwordHash =
    "$2a$10$y7MEqKYoVZvOHOymENF2Cu0MzWFqq7cwBSQOhp6V8bGHxS0iIBEuW";

  const member: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: memberEmail,
        password_hash: passwordHash,
      } satisfies IMember.IJoin,
    });
  typia.assert(member);

  // Create a community with a unique name that will not be found by search term
  const communityName =
    "search-test-community-" + RandomGenerator.alphaNumeric(15);
  const community: ICommunityPlatformCommunity =
    await api.functional.communityPlatform.member.communities.create(
      connection,
      {
        body: {
          name: communityName,
          category: "Tech & Programming",
          description: "This is a test community for search functionality",
        } satisfies ICommunityPlatformCommunity.ICreate,
      },
    );
  typia.assert(community);

  // Search with a term that doesn't match any community name or description
  // Use a very long random string to ensure no accidental match
  const searchQuery =
    "nonexistent-community-" + RandomGenerator.alphaNumeric(24);
  const searchResult: IPageICommunityPlatformCommunity =
    await api.functional.communityPlatform.search.sub_communities.search(
      connection,
      {
        body: {
          search: searchQuery,
          page: 1,
          limit: 20,
        } satisfies ICommunityPlatformCommunity.IRequest,
      },
    );
  typia.assert(searchResult);

  // Validate search results: empty array and correct pagination
  TestValidator.equals(
    "search should return empty array",
    searchResult.data.length,
    0,
  );
  TestValidator.equals(
    "pagination total should be 0",
    searchResult.pagination.records,
    0,
  );
  TestValidator.equals(
    "pagination current page should be 1",
    searchResult.pagination.current,
    1,
  );
  TestValidator.equals(
    "pagination limit should be 20",
    searchResult.pagination.limit,
    20,
  );
  TestValidator.equals(
    "pagination pages should be 0",
    searchResult.pagination.pages,
    0,
  );
}
