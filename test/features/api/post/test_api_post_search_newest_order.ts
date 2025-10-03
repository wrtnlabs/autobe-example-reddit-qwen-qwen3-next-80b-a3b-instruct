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

export async function test_api_post_search_newest_order(
  connection: api.IConnection,
) {
  // 1. Create authenticated member account for performing search operations
  const memberEmail: string = typia.random<string & tags.Format<"email">>();
  const member: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: memberEmail,
        password_hash: "hashedPassword123",
      } satisfies IMember.IJoin,
    });
  typia.assert(member);

  // 2. Create multiple communities to host test posts
  const communityNames = [
    "tech-community",
    "science-community",
    "games-community",
    "lifestyle-community",
  ];

  const createdCommunities: ICommunityPlatformCommunity[] = [];

  for (const name of communityNames) {
    const community: ICommunityPlatformCommunity =
      await api.functional.communityPlatform.member.communities.create(
        connection,
        {
          body: {
            name: name,
            category:
              name === "tech-community"
                ? "Tech & Programming"
                : name === "science-community"
                  ? "Science"
                  : name === "games-community"
                    ? "Games"
                    : "Lifestyle & Wellness",
            description: RandomGenerator.paragraph({ sentences: 2 }),
          } satisfies ICommunityPlatformCommunity.ICreate,
        },
      );
    typia.assert(community);
    createdCommunities.push(community);
  }

  // 3. Create multiple posts in different communities with varying creation timestamps
  const posts: ICommunityPlatformPost[] = [];

  // Create posts with timestamps offset from current date (past 1-5 days)
  const baseDate = new Date();

  for (let i = 0; i < 25; i++) {
    // Select a community in a cyclic pattern
    const community = createdCommunities[i % createdCommunities.length];

    // Calculate a date that's 1-5 days ago for variation
    const postDate = new Date(
      baseDate.getTime() - ((i % 5) + 1) * 24 * 60 * 60 * 1000,
    );

    // Create a post with timestamp
    const post: ICommunityPlatformPost =
      await api.functional.communityPlatform.member.posts.create(connection, {
        body: {
          community_id: community.id,
          title: RandomGenerator.paragraph({
            sentences: 1,
            wordMin: 3,
            wordMax: 5,
          }),
          body: RandomGenerator.content({
            paragraphs: 1,
            sentenceMin: 4,
            sentenceMax: 8,
          }),
        } satisfies ICommunityPlatformPost.ICreate,
      });
    typia.assert(post);

    // Modify the post's created_at to be in the past for testing sort order
    // Keep original reference
    const postWithPastDate: ICommunityPlatformPost = {
      ...post,
      created_at: postDate.toISOString(),
    };
    posts.push(postWithPastDate);
  }

  // 4. Search for posts with 'newest' sort order
  const searchRequest: ICommunityPlatformCommunityPlatformPostIRequest = {
    query: "", // Empty query to return all posts
    sort: "newest", // 'newest' sort order
    page: 1, // First page
    limit: 20, // Maximum 20 items per page
  };

  const searchResult: IPageICommunityPlatformCommunityPlatformPostISummary =
    await api.functional.communityPlatform.posts.search(connection, {
      body: searchRequest,
    });
  typia.assert(searchResult);

  // 5. Validate search results: posts are ordered by creation timestamp descending, then by ID descending
  const returnedPosts = searchResult.data;

  // Verify returned posts are at most 20 items (limit)
  TestValidator.equals("search results limit", returnedPosts.length, 20);

  // Verify all posts are active (not deleted)
  for (const post of returnedPosts) {
    TestValidator.predicate(
      "post is not deleted",
      post.id !== "deleted-post-id",
    );
  }

  // Validate sorting: posts should be sorted by created_at descending, then by id descending
  for (let i = 0; i < returnedPosts.length - 1; i++) {
    const currentPost = returnedPosts[i];
    const nextPost = returnedPosts[i + 1];

    // Compare timestamps first
    const currentTimestamp = new Date(currentPost.created_at).getTime();
    const nextTimestamp = new Date(nextPost.created_at).getTime();

    if (currentTimestamp > nextTimestamp) {
      // Current post is newer - correct order
      continue;
    } else if (currentTimestamp === nextTimestamp) {
      // Timestamps are equal - check post ID for descending order
      // Compare IDs as strings (UUID)
      TestValidator.predicate(
        "posts with same timestamp sorted by ID descending",
        currentPost.id > nextPost.id,
      );
    } else {
      // Current timestamp is older - wrong order
      TestValidator.predicate(
        "posts should be sorted by creation date descending",
        false,
      );
    }
  }

  // 6. Validate total count reflects only active posts
  // Since we created 25 posts, and all are active (none were deleted), expect 25 total
  TestValidator.equals(
    "total posts count",
    searchResult.pagination.records,
    25,
  );

  // 7. Verify pagination information is correct
  TestValidator.equals("current page", searchResult.pagination.current, 1);
  TestValidator.equals("limit per page", searchResult.pagination.limit, 20);
  TestValidator.equals("total pages", searchResult.pagination.pages, 2); // 25 posts / 20 per page = 2 pages

  // 8. Test second page to verify continuation
  const secondPageRequest: ICommunityPlatformCommunityPlatformPostIRequest = {
    query: "",
    sort: "newest",
    page: 2,
    limit: 20,
  };

  const secondPageResult: IPageICommunityPlatformCommunityPlatformPostISummary =
    await api.functional.communityPlatform.posts.search(connection, {
      body: secondPageRequest,
    });
  typia.assert(secondPageResult);

  TestValidator.equals(
    "second page results count",
    secondPageResult.data.length,
    5,
  ); // 25 - 20 = 5 remaining
  TestValidator.equals(
    "second page current",
    secondPageResult.pagination.current,
    2,
  );
  TestValidator.equals(
    "second page total pages",
    secondPageResult.pagination.pages,
    2,
  );

  // 9. No need to delete test data as the test environment should handle cleanup
}
