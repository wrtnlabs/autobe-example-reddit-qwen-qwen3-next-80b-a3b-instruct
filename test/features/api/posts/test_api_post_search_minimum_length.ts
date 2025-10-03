import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunityPlatformCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunity";
import type { ICommunityPlatformCommunityPlatformPostIRequest } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunityPlatformPostIRequest";
import type { ICommunityPlatformCommunityPlatformPostISummary } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunityPlatformPostISummary";
import type { ICommunityPlatformMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformMember";
import type { ICommunityPlatformPost } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformPost";
import type { IMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IMember";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageICommunityPlatformCommunityPlatformPostISummary } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageICommunityPlatformCommunityPlatformPostISummary";

export async function test_api_post_search_minimum_length(
  connection: api.IConnection,
) {
  // 1. Authenticate member
  const memberEmail: string = typia.random<string & tags.Format<"email">>();
  const member: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: memberEmail,
        password_hash: "password123",
      } satisfies IMember.IJoin,
    });
  typia.assert(member);

  // 2. Create community
  const communityName: string = RandomGenerator.alphaNumeric(6); // 6 alphanumeric chars, valid format
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

  // 3. Create a post with predictable 2-character string
  const searchKeyword: string = "aa"; // Fixed 2-character string for test
  const postTitle: string = "Test " + searchKeyword + " content"; // Title contains "aa"
  const postBody: string = "This is a test " + searchKeyword + " post"; // Body contains "aa"
  const post: ICommunityPlatformPost =
    await api.functional.communityPlatform.member.posts.create(connection, {
      body: {
        community_id: community.id,
        title: postTitle,
        body: postBody,
      } satisfies ICommunityPlatformPost.ICreate,
    });
  typia.assert(post);

  // 4. Test search with invalid query (1 character)
  await TestValidator.error(
    "search with single character should fail",
    async () => {
      await api.functional.communityPlatform.posts.search(connection, {
        body: {
          query: "a", // 1 character - should be rejected with 400 Bad Request
          sort: "newest",
          page: 1,
          limit: 20,
        } satisfies ICommunityPlatformCommunityPlatformPostIRequest,
      });
    },
  );

  // 5. Test search with valid query (2 characters)
  const searchResult: IPageICommunityPlatformCommunityPlatformPostISummary =
    await api.functional.communityPlatform.posts.search(connection, {
      body: {
        query: searchKeyword, // 2 characters - should succeed and return the post
        sort: "newest",
        page: 1,
        limit: 20,
      } satisfies ICommunityPlatformCommunityPlatformPostIRequest,
    });
  typia.assert(searchResult);
  TestValidator.predicate(
    "search returned results",
    searchResult.data.length > 0,
  );
}
