import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunityPlatformCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunity";
import type { ICommunityPlatformMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformMember";
import type { ICommunityPlatformPost } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformPost";
import type { IMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IMember";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageICommunityPlatformPost } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageICommunityPlatformPost";

export async function test_api_search_posts_minimum_length(
  connection: api.IConnection,
) {
  // 1. Authenticate as member
  const memberEmail = typia.random<string & tags.Format<"email">>();
  const member: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: memberEmail,
        password_hash: "hashed_password_123",
      } satisfies IMember.IJoin,
    });
  typia.assert(member);

  // 2. Create a community for post creation
  const communityName = RandomGenerator.alphabets(8);
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

  // 3. Create a post with searchable content
  const postTitle = "Sample post for search testing";
  const postBody =
    "This post contains search terms that will be used to validate the minimum length requirement.";
  const post: ICommunityPlatformPost =
    await api.functional.communityPlatform.member.posts.create(connection, {
      body: {
        community_id: community.id,
        title: postTitle,
        body: postBody,
      } satisfies ICommunityPlatformPost.ICreate,
    });
  typia.assert(post);

  // 4. Test search with 0-character query (should fail)
  await TestValidator.error(
    "search with empty string should fail with 400",
    async () => {
      await api.functional.communityPlatform.search.posts.search(connection, {
        body: {
          q: "", // 0 characters
        } satisfies ICommunityPlatformPost.IRequest,
      });
    },
  );

  // 5. Test search with 1-character query (should fail)
  await TestValidator.error(
    "search with single character should fail with 400",
    async () => {
      await api.functional.communityPlatform.search.posts.search(connection, {
        body: {
          q: "a", // 1 character
        } satisfies ICommunityPlatformPost.IRequest,
      });
    },
  );

  // 6. Test search with 2-character query (should succeed)
  const searchQuery = "sa"; // 2 characters
  const searchResult: IPageICommunityPlatformPost =
    await api.functional.communityPlatform.search.posts.search(connection, {
      body: {
        q: searchQuery, // 2 characters
      } satisfies ICommunityPlatformPost.IRequest,
    });
  typia.assert(searchResult);
  TestValidator.predicate(
    "search with 2 characters should return results",
    searchResult.data.length > 0,
  );

  // 7. Test search with longer query (should succeed)
  const longerQuery = "sample post"; // more than 2 characters
  const longerResult: IPageICommunityPlatformPost =
    await api.functional.communityPlatform.search.posts.search(connection, {
      body: {
        q: longerQuery,
      } satisfies ICommunityPlatformPost.IRequest,
    });
  typia.assert(longerResult);
  TestValidator.predicate(
    "search with longer query should return results",
    longerResult.data.length > 0,
  );
}
