import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunityPlatformCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunity";
import type { ICommunityPlatformMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformMember";
import type { ICommunityPlatformPost } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformPost";
import type { IMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IMember";

export async function test_api_post_retrieval_by_search_id_authenticated(
  connection: api.IConnection,
) {
  // Step 1: Authenticate as member to create content
  const memberEmail: string = typia.random<string & tags.Format<"email">>();
  const member: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: memberEmail,
        password_hash: "hashed_password_123",
      } satisfies IMember.IJoin,
    });
  typia.assert(member);

  // Step 2: Create a community to place the test post in
  const communityName: string = RandomGenerator.alphaNumeric(10);
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

  // Step 3: Create the post to be retrieved by the search endpoint
  const postTitle: string = RandomGenerator.paragraph({
    sentences: 3,
    wordMin: 3,
    wordMax: 7,
  });
  const postBody: string = RandomGenerator.content({
    paragraphs: 3,
    sentenceMin: 10,
    sentenceMax: 15,
    wordMin: 3,
    wordMax: 8,
  });
  const post: ICommunityPlatformPost =
    await api.functional.communityPlatform.member.posts.create(connection, {
      body: {
        community_id: community.id,
        title: postTitle,
        body: postBody,
      } satisfies ICommunityPlatformPost.ICreate,
    });
  typia.assert(post);

  // Step 4: Retrieve the post via the search endpoint using its unique ID
  const retrievedPost: ICommunityPlatformPost =
    await api.functional.communityPlatform.search.posts.at(connection, {
      postId: post.id,
    });
  typia.assert(retrievedPost);

  // Step 5: Verify that response contains full title, body, author details, timestamp, and community association
  TestValidator.equals(
    "retrieved post ID matches created post",
    retrievedPost.id,
    post.id,
  );
  TestValidator.equals(
    "retrieved post title matches created post",
    retrievedPost.title,
    post.title,
  );
  TestValidator.equals(
    "retrieved post body matches created post",
    retrievedPost.body,
    post.body,
  );
  TestValidator.equals(
    "retrieved post community_id matches created post",
    retrievedPost.community_id,
    post.community_id,
  );
  TestValidator.equals(
    "retrieved post author_id matches created post",
    retrievedPost.author_id,
    post.author_id,
  );
  TestValidator.predicate(
    "retrieved post created_at is in ISO 8601 format",
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(
      retrievedPost.created_at,
    ),
  );
  TestValidator.equals(
    "retrieved post author_display_name is null (not provided)",
    retrievedPost.author_display_name,
    null,
  );
  TestValidator.notEquals(
    "retrieved post created_at should not be undefined",
    retrievedPost.created_at,
    undefined,
  );
}
