import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunityPlatformCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunity";
import type { ICommunityPlatformMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformMember";
import type { ICommunityPlatformPost } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformPost";
import type { IMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IMember";

export async function test_api_post_retrieval_by_id(
  connection: api.IConnection,
) {
  // 1. Create authenticated member account
  const memberEmail: string = typia.random<string & tags.Format<"email">>();
  const member: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: memberEmail,
        password_hash: "hashed_password_123", // Required by IMember.IJoin
      } satisfies IMember.IJoin,
    });
  typia.assert(member);

  // 2. Create a community to host the test post
  const communityName: string = RandomGenerator.alphaNumeric(8);
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

  // 3. Create a test post to be retrieved by its ID
  const post: ICommunityPlatformPost =
    await api.functional.communityPlatform.member.posts.create(connection, {
      body: {
        community_id: community.id,
        title: RandomGenerator.paragraph({
          sentences: 2,
          wordMin: 3,
          wordMax: 7,
        }),
        body: RandomGenerator.content({
          paragraphs: 2,
          sentenceMin: 5,
          sentenceMax: 10,
          wordMin: 3,
          wordMax: 8,
        }),
      } satisfies ICommunityPlatformPost.ICreate,
    });
  typia.assert(post);

  // 4. Retrieve the created post by its ID
  const retrievedPost: ICommunityPlatformPost =
    await api.functional.communityPlatform.posts.at(connection, {
      postId: post.id,
    });
  typia.assert(retrievedPost);

  // 5. Validate retrieved post details
  TestValidator.equals("post ID matches", retrievedPost.id, post.id);
  TestValidator.equals("post title matches", retrievedPost.title, post.title);
  TestValidator.equals("post body matches", retrievedPost.body, post.body);
  TestValidator.equals(
    "community ID matches",
    retrievedPost.community_id,
    post.community_id,
  );
  TestValidator.equals("author ID matches", retrievedPost.author_id, member.id);
  TestValidator.equals(
    "author display name is undefined when not set",
    retrievedPost.author_display_name,
    post.author_display_name,
  );
  TestValidator.predicate(
    "post created_at is valid date-time",
    new Date(retrievedPost.created_at).toISOString() ===
      retrievedPost.created_at,
  );

  // 6. Verify that a non-existent post returns 404 Not Found
  const nonExistentPostId = typia.random<string & tags.Format<"uuid">>();
  await TestValidator.error("non-existent post should return 404", async () => {
    await api.functional.communityPlatform.posts.at(connection, {
      postId: nonExistentPostId,
    });
  });

  // 7. Verify that anonymous author is NULL when provided as null in request (UI renders 'Anonymous')
  const anonymousPost: ICommunityPlatformPost =
    await api.functional.communityPlatform.member.posts.create(connection, {
      body: {
        community_id: community.id,
        title: RandomGenerator.paragraph({
          sentences: 2,
          wordMin: 3,
          wordMax: 7,
        }),
        body: RandomGenerator.content({
          paragraphs: 2,
          sentenceMin: 5,
          sentenceMax: 10,
          wordMin: 3,
          wordMax: 8,
        }),
        author_display_name: null,
      } satisfies ICommunityPlatformPost.ICreate,
    });
  typia.assert(anonymousPost);

  const retrievedAnonymousPost: ICommunityPlatformPost =
    await api.functional.communityPlatform.posts.at(connection, {
      postId: anonymousPost.id,
    });
  typia.assert(retrievedAnonymousPost);
  TestValidator.equals(
    "anonymous author returns null from API",
    retrievedAnonymousPost.author_display_name,
    null,
  );
}
