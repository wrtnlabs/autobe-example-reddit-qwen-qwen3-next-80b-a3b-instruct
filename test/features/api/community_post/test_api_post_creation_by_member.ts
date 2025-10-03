import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunityPlatformCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunity";
import type { ICommunityPlatformMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformMember";
import type { ICommunityPlatformPost } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformPost";
import type { IMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IMember";

export async function test_api_post_creation_by_member(
  connection: api.IConnection,
) {
  // Step 1: Create a member account for authentication
  const email: string = typia.random<string & tags.Format<"email">>();
  const password: string = "SecurePass123!";
  const member: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email,
        password_hash: password,
      } satisfies IMember.IJoin,
    });
  typia.assert(member);

  // Step 2: Create a community for the post to belong to
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

  // Step 3: Create a post with valid title and body content
  const postTitle: string = RandomGenerator.paragraph({
    sentences: 5,
    wordMin: 3,
    wordMax: 8,
  });
  const postBody: string = RandomGenerator.content({
    paragraphs: 2,
    sentenceMin: 10,
    sentenceMax: 20,
    wordMin: 3,
    wordMax: 8,
  });

  const createdPost: ICommunityPlatformPost =
    await api.functional.communityPlatform.member.posts.create(connection, {
      body: {
        community_id: community.id,
        title: postTitle,
        body: postBody,
      } satisfies ICommunityPlatformPost.ICreate,
    });
  typia.assert(createdPost);

  // Step 4: Validate that the created post has correct properties
  TestValidator.equals(
    "post community_id matches",
    createdPost.community_id,
    community.id,
  );
  TestValidator.equals("post title matches", createdPost.title, postTitle);
  TestValidator.equals("post body matches", createdPost.body, postBody);
  TestValidator.equals(
    "post author_id matches",
    createdPost.author_id,
    member.id,
  );
  TestValidator.predicate(
    "post has valid UUID id",
    /^[0-9a-f-]{36}$/i.test(createdPost.id),
  );
  TestValidator.predicate(
    "post has created_at timestamp",
    !!createdPost.created_at,
  );
  TestValidator.equals(
    "post author_display_name is undefined",
    createdPost.author_display_name,
    undefined,
  );

  // Step 5: Test that unauthenticated request fails with unauthorized error
  const unauthConn: api.IConnection = { ...connection, headers: {} };
  await TestValidator.error("unauthenticated request should fail", async () => {
    await api.functional.communityPlatform.member.posts.create(unauthConn, {
      body: {
        community_id: community.id,
        title: postTitle,
        body: postBody,
      } satisfies ICommunityPlatformPost.ICreate,
    });
  });

  // Step 6: Test title length validation - below minimum (4 characters)
  await TestValidator.error(
    "title below minimum length should fail",
    async () => {
      await api.functional.communityPlatform.member.posts.create(connection, {
        body: {
          community_id: community.id,
          title: "Too", // 3 characters - below 5 char minimum
          body: postBody,
        } satisfies ICommunityPlatformPost.ICreate,
      });
    },
  );

  // Step 7: Test title length validation - above maximum (121 characters)
  await TestValidator.error(
    "title above maximum length should fail",
    async () => {
      const longTitle = "a".repeat(121); // Exactly 121 characters
      await api.functional.communityPlatform.member.posts.create(connection, {
        body: {
          community_id: community.id,
          title: longTitle,
          body: postBody,
        } satisfies ICommunityPlatformPost.ICreate,
      });
    },
  );

  // Step 8: Test body length validation - below minimum (9 characters)
  await TestValidator.error(
    "body below minimum length should fail",
    async () => {
      await api.functional.communityPlatform.member.posts.create(connection, {
        body: {
          community_id: community.id,
          title: postTitle,
          body: "Too short", // 9 characters - below 10 char minimum
        } satisfies ICommunityPlatformPost.ICreate,
      });
    },
  );

  // Step 9: Test body length validation - above maximum (10,001 characters)
  await TestValidator.error(
    "body above maximum length should fail",
    async () => {
      const longBody = "a".repeat(10001); // Exactly 10,001 characters
      await api.functional.communityPlatform.member.posts.create(connection, {
        body: {
          community_id: community.id,
          title: postTitle,
          body: longBody,
        } satisfies ICommunityPlatformPost.ICreate,
      });
    },
  );
}
