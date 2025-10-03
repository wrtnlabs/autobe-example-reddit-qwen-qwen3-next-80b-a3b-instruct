import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { ICommunityPlatformCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunity";
import type { ICommunityPlatformPost } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformPost";

export async function test_api_retrieve_post_by_id(
  connection: api.IConnection,
) {
  // 1. Create a community for the post
  const communityName = RandomGenerator.name()
    .replace(/\s+/g, "-")
    .toLowerCase();
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

  // 2. Create a post in the community
  const postTitle = RandomGenerator.paragraph({ sentences: 3 });
  const postBody = RandomGenerator.content({ paragraphs: 2 });
  const authorDisplayName = RandomGenerator.name();
  const post: ICommunityPlatformPost =
    await api.functional.communityPlatform.member.posts.create(connection, {
      body: {
        community_id: community.id,
        title: postTitle,
        body: postBody,
        author_display_name: authorDisplayName,
      } satisfies ICommunityPlatformPost.ICreate,
    });
  typia.assert(post);
  TestValidator.equals(
    "post community_id matches created community",
    post.community_id,
    community.id,
  );
  TestValidator.equals(
    "post title matches created title",
    post.title,
    postTitle,
  );
  TestValidator.equals("post body matches created body", post.body, postBody);
  TestValidator.equals(
    "post author_display_name matches created display name",
    post.author_display_name,
    authorDisplayName,
  );

  // 3. Retrieve the post by its ID as an authenticated user
  const retrievedPost: ICommunityPlatformPost =
    await api.functional.communityPlatform.posts.at(connection, {
      postId: post.id,
    });
  typia.assert(retrievedPost);
  TestValidator.equals(
    "retrieved post ID matches created post ID",
    retrievedPost.id,
    post.id,
  );
  TestValidator.equals(
    "retrieved post title matches created title",
    retrievedPost.title,
    post.title,
  );
  TestValidator.equals(
    "retrieved post body matches created body",
    retrievedPost.body,
    post.body,
  );
  TestValidator.equals(
    "retrieved post author_display_name matches created display name",
    retrievedPost.author_display_name,
    post.author_display_name,
  );
  TestValidator.equals(
    "retrieved post created_at matches created post",
    retrievedPost.created_at,
    post.created_at,
  );

  // 4. Retrieve the post by its ID as an anonymous user (no auth required)
  // Since the endpoint doesn't require authentication, we can use the same connection
  const anonymousRetrievedPost: ICommunityPlatformPost =
    await api.functional.communityPlatform.posts.at(connection, {
      postId: post.id,
    });
  typia.assert(anonymousRetrievedPost);
  TestValidator.equals(
    "anonymous retrieved post ID matches created post ID",
    anonymousRetrievedPost.id,
    post.id,
  );
  TestValidator.equals(
    "anonymous retrieved post title matches created title",
    anonymousRetrievedPost.title,
    post.title,
  );
  TestValidator.equals(
    "anonymous retrieved post body matches created body",
    anonymousRetrievedPost.body,
    post.body,
  );
  TestValidator.equals(
    "anonymous retrieved post author_display_name matches created display name",
    anonymousRetrievedPost.author_display_name,
    post.author_display_name,
  );
  TestValidator.equals(
    "anonymous retrieved post created_at matches created post",
    anonymousRetrievedPost.created_at,
    post.created_at,
  );

  // 5. Test retrieving a non-existent post ID (should return 404)
  await TestValidator.error(
    "non-existent post ID should return 404",
    async () => {
      await api.functional.communityPlatform.posts.at(connection, {
        postId: "00000000-0000-0000-0000-000000000000", // Valid UUID format but non-existent post
      });
    },
  );
}
