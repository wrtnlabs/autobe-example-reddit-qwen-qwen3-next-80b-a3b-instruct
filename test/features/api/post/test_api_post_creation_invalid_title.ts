import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunityPlatformCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunity";
import type { ICommunityPlatformMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformMember";
import type { ICommunityPlatformPost } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformPost";
import type { IMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IMember";

export async function test_api_post_creation_invalid_title(
  connection: api.IConnection,
) {
  // 1. Authenticate a member user
  const memberEmail: string = typia.random<string & tags.Format<"email">>();
  const member: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: memberEmail,
        password_hash: "hashedpassword123",
      } satisfies IMember.IJoin,
    });
  typia.assert(member);

  // 2. Create a community for the post
  const community: ICommunityPlatformCommunity =
    await api.functional.communityPlatform.member.communities.create(
      connection,
      {
        body: {
          name: RandomGenerator.alphaNumeric(8),
          category: "Tech & Programming",
        } satisfies ICommunityPlatformCommunity.ICreate,
      },
    );
  typia.assert(community);

  // 3. Test creation with title under 5 characters
  await TestValidator.error(
    "should reject title under 5 characters",
    async () => {
      await api.functional.communityPlatform.member.posts.create(connection, {
        body: {
          community_id: community.id,
          title: "ABC", // 3 characters - too short
          body: "This is a test content that meets the minimum length requirement.",
        } satisfies ICommunityPlatformPost.ICreate,
      });
    },
  );

  // 4. Test creation with title exactly 5 characters (valid)
  const validShortPost: ICommunityPlatformPost =
    await api.functional.communityPlatform.member.posts.create(connection, {
      body: {
        community_id: community.id,
        title: "Hello", // 5 characters - valid minimum
        body: "This is a test content that meets the minimum length requirement.",
      } satisfies ICommunityPlatformPost.ICreate,
    });
  typia.assert(validShortPost);
  TestValidator.equals("title matches expected", validShortPost.title, "Hello");

  // 5. Test creation with title exactly 120 characters (valid)
  const longTitle = RandomGenerator.alphaNumeric(120);
  const validLongPost: ICommunityPlatformPost =
    await api.functional.communityPlatform.member.posts.create(connection, {
      body: {
        community_id: community.id,
        title: longTitle, // 120 characters - valid maximum
        body: "This is a test content that meets the minimum length requirement.",
      } satisfies ICommunityPlatformPost.ICreate,
    });
  typia.assert(validLongPost);
  TestValidator.equals(
    "title matches expected",
    validLongPost.title,
    longTitle,
  );

  // 6. Test creation with title over 120 characters
  await TestValidator.error(
    "should reject title over 120 characters",
    async () => {
      await api.functional.communityPlatform.member.posts.create(connection, {
        body: {
          community_id: community.id,
          title: RandomGenerator.alphaNumeric(121), // 121 characters - too long
          body: "This is a test content that meets the minimum length requirement.",
        } satisfies ICommunityPlatformPost.ICreate,
      });
    },
  );
}
