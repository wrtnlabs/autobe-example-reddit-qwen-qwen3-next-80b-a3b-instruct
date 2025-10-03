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

export async function test_api_post_search_minimum_query_length(
  connection: api.IConnection,
) {
  // 1. Create an authenticated member account
  const memberEmail: string = typia.random<string & tags.Format<"email">>();
  const member: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: memberEmail,
        password_hash: "hashed_password_123", // Provided as required
      } satisfies IMember.IJoin,
    });
  typia.assert(member);

  // 2. Create a community to host test posts
  const communityName = `testcommunity_${RandomGenerator.alphaNumeric(8)}`;
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

  // 3. Create a post with content to search for
  const postTitle = "A valid post for search testing";
  const postBody = "This is the content of a post that can be searched.";
  const createdPost: ICommunityPlatformPost =
    await api.functional.communityPlatform.member.posts.create(connection, {
      body: {
        community_id: community.id,
        title: postTitle,
        body: postBody,
      } satisfies ICommunityPlatformPost.ICreate,
    });
  typia.assert(createdPost);

  // 4. Test search with single character (should fail)
  await TestValidator.error(
    "search with 1 character should return 400 Bad Request",
    async () => {
      await api.functional.communityPlatform.posts.search(connection, {
        body: {
          query: "a", // Single character - violates minimum
          sort: "newest",
          page: 1,
          limit: 20,
        } satisfies ICommunityPlatformCommunityPlatformPostIRequest,
      });
    },
  );

  // 5. Test search with two characters (should succeed)
  const searchResult: IPageICommunityPlatformCommunityPlatformPostISummary =
    await api.functional.communityPlatform.posts.search(connection, {
      body: {
        query: "an", // Two characters - meets minimum
        sort: "newest",
        page: 1,
        limit: 20,
      } satisfies ICommunityPlatformCommunityPlatformPostIRequest,
    });
  typia.assert(searchResult);
  TestValidator.predicate(
    "search with 2 characters returns results",
    searchResult.data.length > 0,
  );

  // 6. Test search with longer string (should succeed)
  const longerResult: IPageICommunityPlatformCommunityPlatformPostISummary =
    await api.functional.communityPlatform.posts.search(connection, {
      body: {
        query: "valid post for search testing", // Longer than 2
        sort: "newest",
        page: 1,
        limit: 20,
      } satisfies ICommunityPlatformCommunityPlatformPostIRequest,
    });
  typia.assert(longerResult);
  TestValidator.predicate(
    "search with long query returns results",
    longerResult.data.length > 0,
  );

  // 7. Test search with exact title match (should succeed)
  const exactResult: IPageICommunityPlatformCommunityPlatformPostISummary =
    await api.functional.communityPlatform.posts.search(connection, {
      body: {
        query: postTitle, // Exact match with title
        sort: "newest",
        page: 1,
        limit: 20,
      } satisfies ICommunityPlatformCommunityPlatformPostIRequest,
    });
  typia.assert(exactResult);
  TestValidator.predicate(
    "search with exact title returns results",
    exactResult.data.length > 0,
  );
  TestValidator.equals(
    "first result matches created post title",
    exactResult.data[0].title,
    postTitle,
  );
}
