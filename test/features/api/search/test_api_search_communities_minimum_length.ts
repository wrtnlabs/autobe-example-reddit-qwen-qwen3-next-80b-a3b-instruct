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

export async function test_api_search_communities_minimum_length(
  connection: api.IConnection,
) {
  // 1. Authenticate as member
  const memberEmail: string = typia.random<string & tags.Format<"email">>();
  const member: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: memberEmail,
        password_hash: "hash123", // Required field according to IMember.IJoin
      } satisfies IMember.IJoin,
    });
  typia.assert(member);

  // 2. Create multiple communities with varied names for search testing
  // Use names that are ≥5 characters to comply with ICommunityPlatformCommunity.ICreate.name constraint
  const validCommunityNames = [
    "techhub",
    "coding",
    "gaming",
    "abacus", // Contains 'ab' - for 2-character search test
    "artanddesign",
    "businessfinance",
  ] as const;
  const createdCommunities: ICommunityPlatformCommunity[] = [];

  for (const name of validCommunityNames) {
    // Only use valid names (≥5 chars)
    const category: ICommunityPlatformCommunity.ICreate["category"] =
      "Tech & Programming";
    const community: ICommunityPlatformCommunity =
      await api.functional.communityPlatform.member.communities.create(
        connection,
        {
          body: {
            name,
            category,
          } satisfies ICommunityPlatformCommunity.ICreate,
        },
      );
    typia.assert(community);
    createdCommunities.push(community);
  }

  // 3. Test search with 0 characters (should fail)
  await TestValidator.error(
    "search with 0 characters should return 400 error",
    async () => {
      await api.functional.communityPlatform.search.sub_communities.search(
        connection,
        {
          body: {
            search: "", // Empty string - 0 characters
          } satisfies ICommunityPlatformCommunity.IRequest,
        },
      );
    },
  );

  // 4. Test search with 1 character (should fail)
  await TestValidator.error(
    "search with 1 character should return 400 error",
    async () => {
      await api.functional.communityPlatform.search.sub_communities.search(
        connection,
        {
          body: {
            search: "a", // Single character
          } satisfies ICommunityPlatformCommunity.IRequest,
        },
      );
    },
  );

  // 5. Test search with 2 characters (should succeed - find community named 'abacus')
  const searchResult: IPageICommunityPlatformCommunity =
    await api.functional.communityPlatform.search.sub_communities.search(
      connection,
      {
        body: {
          search: "ab", // Valid 2-character search term to find 'abacus'
        } satisfies ICommunityPlatformCommunity.IRequest,
      },
    );
  typia.assert(searchResult);

  // Validate search result: at least one result and it contains 'abacus'
  TestValidator.predicate(
    "search result should have at least one community",
    () => searchResult.data.length > 0,
  );
  TestValidator.predicate(
    "search result should contain community 'abacus'",
    () => searchResult.data.some((comm) => comm.name === "abacus"),
  );

  // 6. Test search with longer term (should succeed - find community named 'techhub')
  const longerSearchResult: IPageICommunityPlatformCommunity =
    await api.functional.communityPlatform.search.sub_communities.search(
      connection,
      {
        body: {
          search: "tech", // Valid search term to find 'techhub'
        } satisfies ICommunityPlatformCommunity.IRequest,
      },
    );
  typia.assert(longerSearchResult);

  // Validate longer search result
  TestValidator.predicate(
    "longer search result should have at least one community",
    () => longerSearchResult.data.length > 0,
  );
  TestValidator.predicate(
    "longer search result should contain community 'techhub'",
    () => longerSearchResult.data.some((comm) => comm.name === "techhub"),
  );
}
