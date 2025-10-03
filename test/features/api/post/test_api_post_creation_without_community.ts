import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunityPlatformMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformMember";
import type { ICommunityPlatformPost } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformPost";
import type { IMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IMember";

export async function test_api_post_creation_without_community(
  connection: api.IConnection,
) {
  // 1. Authenticate a member user
  const email: string = typia.random<string & tags.Format<"email">>();
  const passwordHash: string = "hashed_password_123"; // Realistic hash format
  const authenticatedMember: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email,
        password_hash: passwordHash,
      } satisfies IMember.IJoin,
    });
  typia.assert(authenticatedMember);

  // 2. Attempt to create a post with an invalid (non-existent) community_id
  // The system should reject this with a 400 or 404 error
  // Use a UUID that is guaranteed to be non-existent (e.g., 00000000-0000-0000-0000-000000000000)
  const invalidCommunityId = "00000000-0000-0000-0000-000000000000";
  const postTitle = RandomGenerator.paragraph({
    sentences: 3,
    wordMin: 5,
    wordMax: 10,
  });
  const postBody = RandomGenerator.content({
    paragraphs: 1,
    sentenceMin: 10,
    sentenceMax: 15,
  });

  // Use await with TestValidator.error because the callback is async
  await TestValidator.error(
    "post creation with invalid community_id should fail",
    async () => {
      await api.functional.communityPlatform.member.posts.create(connection, {
        body: {
          community_id: invalidCommunityId, // Invalid community reference
          title: postTitle,
          body: postBody,
        } satisfies ICommunityPlatformPost.ICreate,
      });
    },
  );
}
