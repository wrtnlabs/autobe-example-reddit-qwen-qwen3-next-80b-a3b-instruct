import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunityPlatformCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunity";
import type { ICommunityPlatformMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformMember";
import type { IMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IMember";

export async function test_api_community_creation_invalid_name(
  connection: api.IConnection,
) {
  // Authenticate a member user to have required permissions
  const memberEmail: string = typia.random<string & tags.Format<"email">>();
  const member: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: memberEmail,
        password_hash: "$2a$10$" + RandomGenerator.alphaNumeric(53), // Valid bcrypt hash format with 60-character total length
      } satisfies IMember.IJoin,
    });
  typia.assert(member);

  // Test cases for invalid community names

  // Case 1: Name with spaces (invalid)
  await TestValidator.error(
    "community creation should fail with name containing spaces",
    async () => {
      await api.functional.communityPlatform.member.communities.create(
        connection,
        {
          body: {
            name: "invalid community", // Contains space
            category: "Tech & Programming",
          } satisfies ICommunityPlatformCommunity.ICreate,
        },
      );
    },
  );

  // Case 2: Name with special characters (invalid)
  await TestValidator.error(
    "community creation should fail with name containing special characters",
    async () => {
      await api.functional.communityPlatform.member.communities.create(
        connection,
        {
          body: {
            name: "invalid@community", // Contains @
            category: "Science",
          } satisfies ICommunityPlatformCommunity.ICreate,
        },
      );
    },
  );

  // Case 3: Name too short (less than 5 characters, invalid)
  await TestValidator.error(
    "community creation should fail with name shorter than 5 characters",
    async () => {
      await api.functional.communityPlatform.member.communities.create(
        connection,
        {
          body: {
            name: "abc", // Only 3 characters
            category: "Games",
          } satisfies ICommunityPlatformCommunity.ICreate,
        },
      );
    },
  );

  // Case 4: Name too long (more than 64 characters, invalid)
  await TestValidator.error(
    "community creation should fail with name longer than 64 characters",
    async () => {
      const longName = "a".repeat(65); // 65 characters
      await api.functional.communityPlatform.member.communities.create(
        connection,
        {
          body: {
            name: longName,
            category: "Sports",
          } satisfies ICommunityPlatformCommunity.ICreate,
        },
      );
    },
  );

  // Case 5: Name with mixed case and underscores/hyphens (valid pattern)
  // This is for validation that valid patterns still work correctly
  const validName = "valid_community-name_123";
  const validCommunity: ICommunityPlatformCommunity =
    await api.functional.communityPlatform.member.communities.create(
      connection,
      {
        body: {
          name: validName,
          category: "Study & Education",
        } satisfies ICommunityPlatformCommunity.ICreate,
      },
    );
  typia.assert(validCommunity);
  TestValidator.equals(
    "valid community name matches",
    validCommunity.name,
    validName,
  );
}
