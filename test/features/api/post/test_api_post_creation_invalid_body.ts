import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunityPlatformCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunity";
import type { ICommunityPlatformMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformMember";
import type { ICommunityPlatformPost } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformPost";
import type { IMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IMember";

export async function test_api_post_creation_invalid_body(
  connection: api.IConnection,
) {
  // Step 1: Authenticate a member user
  const email = typia.random<string & tags.Format<"email">>();
  const passwordHash = "hashed_password"; // Valid password hash as required by IMember.IJoin

  const authenticatedMember: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email,
        password_hash: passwordHash,
      } satisfies IMember.IJoin,
    });
  typia.assert(authenticatedMember);

  // Step 2: Create a community for the post to belong to
  const communityName = RandomGenerator.alphabets(10);
  const category: ICommunityPlatformCommunity.ICreate["category"] =
    "Tech & Programming";

  const createdCommunity: ICommunityPlatformCommunity =
    await api.functional.communityPlatform.member.communities.create(
      connection,
      {
        body: {
          name: communityName,
          category,
        } satisfies ICommunityPlatformCommunity.ICreate,
      },
    );
  typia.assert(createdCommunity);

  // Step 3: Test creating a post with body content under 10 characters (invalid)
  const tooShortBody = "short"; // 5 characters, below 10-character minimum

  await TestValidator.error(
    "post creation should fail when body is under 10 characters",
    async () => {
      await api.functional.communityPlatform.member.posts.create(connection, {
        body: {
          community_id: createdCommunity.id,
          title: "Valid title",
          body: tooShortBody,
        } satisfies ICommunityPlatformPost.ICreate,
      });
    },
  );

  // Step 4: Test creating a post with body content over 10,000 characters (invalid)
  const tooLongBody = RandomGenerator.content({
    paragraphs: 100, // This will create content far exceeding 10,000 characters
    sentenceMin: 15,
    sentenceMax: 30,
    wordMin: 5,
    wordMax: 15,
  });

  await TestValidator.error(
    "post creation should fail when body exceeds 10,000 characters",
    async () => {
      await api.functional.communityPlatform.member.posts.create(connection, {
        body: {
          community_id: createdCommunity.id,
          title: "Valid title",
          body: tooLongBody,
        } satisfies ICommunityPlatformPost.ICreate,
      });
    },
  );

  // Step 5: Verify that a valid post (10-10,000 characters) can be created successfully
  // This explicitly validates the correct behavior to contrast with the error cases
  const validBody = RandomGenerator.paragraph({
    sentences: 50, // Approximately 150-400 characters, within valid range
    wordMin: 4,
    wordMax: 10,
  });

  const createdPost: ICommunityPlatformPost =
    await api.functional.communityPlatform.member.posts.create(connection, {
      body: {
        community_id: createdCommunity.id,
        title: "Valid title",
        body: validBody,
      } satisfies ICommunityPlatformPost.ICreate,
    });
  typia.assert(createdPost);

  // Validate that the created post has the correct body content
  TestValidator.equals(
    "post body content matches",
    createdPost.body,
    validBody,
  );
}
