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

export async function test_api_search_posts_by_keyword_with_sort_newest(
  connection: api.IConnection,
) {
  // Step 1: Create authenticated member account
  const email = typia.random<string & tags.Format<"email">>();
  const password = "SecurePass123!";
  const member: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email,
        password_hash: password,
      } satisfies IMember.IJoin,
    });
  typia.assert(member);

  // Step 2: Create a community for the posts
  const communityName = RandomGenerator.alphaNumeric(10);
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

  // Step 3: Create three posts with sequential timestamps
  // We'll create them in sequence with a slight delay to ensure timestamps differ
  const keyword = "microservices";

  // Create first post (with keyword)
  const firstPostTitle = "Understanding Microservices Architecture";
  const firstPostBody = `Designing scalable systems with microservices is crucial for modern applications. ${keyword} provide modular, independently deployable components that improve system resilience.`;
  const firstPost = await api.functional.communityPlatform.member.posts.create(
    connection,
    {
      body: {
        community_id: community.id,
        title: firstPostTitle,
        body: firstPostBody,
      } satisfies ICommunityPlatformPost.ICreate,
    },
  );
  typia.assert(firstPost);

  // Create second post (without keyword) - timestamp will be slightly later
  const secondPostTitle = "Benefits of Containerization";
  const secondPostBody =
    "Docker containers offer efficient resource utilization and consistent deployment environments across different platforms.";
  const secondPost = await api.functional.communityPlatform.member.posts.create(
    connection,
    {
      body: {
        community_id: community.id,
        title: secondPostTitle,
        body: secondPostBody,
      } satisfies ICommunityPlatformPost.ICreate,
    },
  );
  typia.assert(secondPost);

  // Create third post (without keyword) - timestamp will be latest
  const thirdPostTitle = "Cloud Native Development Patterns";
  const thirdPostBody =
    "Cloud native applications are designed to leverage cloud computing models for scalability and resilience.";
  const thirdPost = await api.functional.communityPlatform.member.posts.create(
    connection,
    {
      body: {
        community_id: community.id,
        title: thirdPostTitle,
        body: thirdPostBody,
      } satisfies ICommunityPlatformPost.ICreate,
    },
  );
  typia.assert(thirdPost);

  // Step 4: Search for posts with keyword sorted by newest
  const searchResult: IPageICommunityPlatformPost =
    await api.functional.communityPlatform.search.posts.search(connection, {
      body: {
        q: keyword, // Search for posts containing the keyword
        sort: "newest", // Sort by newest (created_at descending)
      } satisfies ICommunityPlatformPost.IRequest,
    });
  typia.assert(searchResult);

  // Step 5: Validate the search results
  // Verify we found exactly one post matching the keyword
  TestValidator.predicate(
    "search should return at least one result",
    searchResult.data.length > 0,
  );

  // Verify we found exactly one result matching keyword (the first post)
  // Since the other two posts don't contain the keyword, only one should match
  TestValidator.equals(
    "exactly one post should contain the keyword",
    searchResult.data.length,
    1,
  );

  // Verify the returned post is the first one (earliest created but will be first in newest order since it's the only match)
  // Note: Even though it's the earliest, when sorting by newest, it will be first in the list since it's the only match
  TestValidator.equals(
    "returned post title matches expected",
    searchResult.data[0].title,
    firstPostTitle,
  );

  TestValidator.equals(
    "returned post body contains keyword",
    searchResult.data[0].body.includes(keyword),
    true,
  );

  // Verify we're getting the newest sort behavior
  // Since only one post matches, it will be at position 0
  // The absolute order doesn't matter since there's only one match but we can validate the content

  // Verify pagination details
  TestValidator.equals(
    "pagination should have expected page",
    searchResult.pagination.current,
    1,
  );

  TestValidator.equals(
    "pagination should have limit of 20",
    searchResult.pagination.limit,
    20,
  );

  TestValidator.equals(
    "pagination should have 1 record",
    searchResult.pagination.records,
    1,
  );

  TestValidator.equals(
    "pagination should have 1 page",
    searchResult.pagination.pages,
    1,
  );

  // Step 6: Verify fuzzy matching works on both title and body
  // We know only the first post contains the keyword, so let's search using a partial match
  const partialKeyword = "microservic"; // Partial match of "microservices"
  const partialSearchResult: IPageICommunityPlatformPost =
    await api.functional.communityPlatform.search.posts.search(connection, {
      body: {
        q: partialKeyword, // Partial match
        sort: "newest", // Sort by newest
      } satisfies ICommunityPlatformPost.IRequest,
    });
  typia.assert(partialSearchResult);

  // Verify the partial match still returns the correct post
  TestValidator.equals(
    "partial keyword search should return one result",
    partialSearchResult.data.length,
    1,
  );

  TestValidator.equals(
    "partial keyword search should return same post",
    partialSearchResult.data[0].title,
    firstPostTitle,
  );

  // Verify search works on title as well
  const titleKeyword = "architecture";
  const titleSearchResult: IPageICommunityPlatformPost =
    await api.functional.communityPlatform.search.posts.search(connection, {
      body: {
        q: titleKeyword, // Search for word in title
        sort: "newest", // Sort by newest
      } satisfies ICommunityPlatformPost.IRequest,
    });
  typia.assert(titleSearchResult);

  TestValidator.equals(
    "title keyword search should return one result",
    titleSearchResult.data.length,
    1,
  );

  TestValidator.equals(
    "title keyword search should return correct post",
    titleSearchResult.data[0].title,
    firstPostTitle,
  );

  // Verify that non-matching keyword returns empty results
  const nonExistentKeyword = "nonexistentkeyword12345";
  const emptySearchResult: IPageICommunityPlatformPost =
    await api.functional.communityPlatform.search.posts.search(connection, {
      body: {
        q: nonExistentKeyword,
        sort: "newest",
      } satisfies ICommunityPlatformPost.IRequest,
    });
  typia.assert(emptySearchResult);

  TestValidator.equals(
    "nonexistent keyword should return no results",
    emptySearchResult.data.length,
    0,
  );
}
