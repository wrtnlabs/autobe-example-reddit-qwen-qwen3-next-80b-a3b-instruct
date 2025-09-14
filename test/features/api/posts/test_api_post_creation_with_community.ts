import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunitybbsAdministrator } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsAdministrator";
import type { ICommunitybbsCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsCommunity";
import type { ICommunitybbsMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsMember";
import type { IMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IMember";
import type { IPost } from "@ORGANIZATION/PROJECT-api/lib/structures/IPost";

export async function test_api_post_creation_with_community(
  connection: api.IConnection,
) {
  // Step 1: Generate a valid UUID for community_id (since community creation endpoint is not available in provided API)
  const validCommunityId = typia.random<string & tags.Format<"uuid">>();

  // Step 2: Create a valid post with minimum content length
  const postTitle = RandomGenerator.paragraph({
    sentences: 3,
    wordMin: 2,
    wordMax: 8,
  }); // 6-24 chars
  const postBody = RandomGenerator.content({
    paragraphs: 1,
    sentenceMin: 5,
    sentenceMax: 10,
  }); // 25-75 chars
  const createdPost: IPost = await api.functional.posts.create(connection, {
    body: {
      communitybbs_community_id: validCommunityId,
      title: postTitle,
      body: postBody,
      display_name: RandomGenerator.name(),
    } satisfies IPost.ICreate,
  });
  typia.assert(createdPost);

  // Step 3: Validate post creation success
  TestValidator.equals(
    "created post ID exists and is UUID",
    createdPost.id.length,
    36,
  );
  TestValidator.equals(
    "community ID matches",
    createdPost.communityId,
    validCommunityId,
  );
  TestValidator.equals("post title matches", createdPost.title, postTitle);
  TestValidator.equals("post body matches", createdPost.body, postBody);
  TestValidator.predicate(
    "author name is populated",
    createdPost.author.length > 0,
  );
  TestValidator.predicate(
    "created_at is ISO date-time",
    /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.\d{3}Z$/.test(
      createdPost.created_at,
    ),
  );

  // Step 4: Test invalid community_id format - 404 Not Found
  await TestValidator.error(
    "should reject with 404 for invalid community_id format",
    async () => {
      await api.functional.posts.create(connection, {
        body: {
          communitybbs_community_id: "invalid-uuid", // Not a valid UUID
          title: postTitle,
          body: postBody,
        } satisfies IPost.ICreate,
      });
    },
  );

  // Step 5: Test empty title - 400 Bad Request
  await TestValidator.error(
    "should reject with 400 for empty title",
    async () => {
      await api.functional.posts.create(connection, {
        body: {
          communitybbs_community_id: validCommunityId,
          title: "", // Empty string
          body: postBody,
        } satisfies IPost.ICreate,
      });
    },
  );

  // Step 6: Test empty body - 400 Bad Request
  await TestValidator.error(
    "should reject with 400 for empty body",
    async () => {
      await api.functional.posts.create(connection, {
        body: {
          communitybbs_community_id: validCommunityId,
          title: postTitle,
          body: "", // Empty string
        } satisfies IPost.ICreate,
      });
    },
  );

  // Step 7: Test title too short - 400 Bad Request
  await TestValidator.error(
    "should reject with 400 for title too short",
    async () => {
      await api.functional.posts.create(connection, {
        body: {
          communitybbs_community_id: validCommunityId,
          title: "Too", // Only 3 characters
          body: postBody,
        } satisfies IPost.ICreate,
      });
    },
  );

  // Step 8: Test title too long - 400 Bad Request
  await TestValidator.error(
    "should reject with 400 for title too long",
    async () => {
      const veryLongTitle = RandomGenerator.paragraph({
        sentences: 50,
        wordMin: 5,
        wordMax: 10,
      }); // 250+ characters
      await api.functional.posts.create(connection, {
        body: {
          communitybbs_community_id: validCommunityId,
          title: veryLongTitle,
          body: postBody,
        } satisfies IPost.ICreate,
      });
    },
  );

  // Step 9: Test body too short - 400 Bad Request
  await TestValidator.error(
    "should reject with 400 for body too short",
    async () => {
      await api.functional.posts.create(connection, {
        body: {
          communitybbs_community_id: validCommunityId,
          title: postTitle,
          body: "Short", // Only 5 characters
        } satisfies IPost.ICreate,
      });
    },
  );

  // Step 10: Test body too long - 400 Bad Request
  await TestValidator.error(
    "should reject with 400 for body too long",
    async () => {
      const veryLongBody = RandomGenerator.content({
        paragraphs: 150,
        sentenceMin: 15,
        sentenceMax: 25,
      }); // 225,000+ characters
      await api.functional.posts.create(connection, {
        body: {
          communitybbs_community_id: validCommunityId,
          title: postTitle,
          body: veryLongBody,
        } satisfies IPost.ICreate,
      });
    },
  );
}
