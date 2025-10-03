import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunityPlatformCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunity";
import type { ICommunityPlatformMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformMember";
import type { IMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IMember";

export async function test_api_community_deletion_by_non_creator(
  connection: api.IConnection,
) {
  // 1. Authenticate the creator of the community
  const creatorEmail = typia.random<string & tags.Format<"email">>();
  const creatorPassword = "securePassword123";
  const creator: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: creatorEmail,
        password_hash: creatorPassword,
      } satisfies IMember.IJoin,
    });
  typia.assert(creator);

  // 2. Authenticate a second member user to attempt unauthorized deletion
  const memberEmail = typia.random<string & tags.Format<"email">>();
  const memberPassword = "anotherSecurePassword456";
  const member: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: memberEmail,
        password_hash: memberPassword,
      } satisfies IMember.IJoin,
    });
  typia.assert(member);

  // 3. Create a community owned by the first authenticated member
  const communityName = RandomGenerator.alphaNumeric(10);
  const category: ICommunityPlatformCommunity.ICreate["category"] =
    RandomGenerator.pick([
      "Tech & Programming",
      "Science",
      "Movies & TV",
      "Games",
      "Sports",
      "Lifestyle & Wellness",
      "Study & Education",
      "Art & Design",
      "Business & Finance",
      "News & Current Affairs",
    ] as const);
  const community: ICommunityPlatformCommunity =
    await api.functional.communityPlatform.member.communities.create(
      connection,
      {
        body: {
          name: communityName,
          category,
        } satisfies ICommunityPlatformCommunity.ICreate,
      },
    );
  typia.assert(community);
  TestValidator.equals("community name matches", community.name, communityName);

  // 4. Attempt to delete the community as the non-creator user
  // Switch to the non-creator member's context by re-authenticating
  await api.functional.auth.member.join(connection, {
    body: {
      email: memberEmail,
      password_hash: memberPassword,
    } satisfies IMember.IJoin,
  });

  // Should fail with 403 Forbidden due to ownership restriction
  await TestValidator.error("non-creator cannot delete community", async () => {
    await api.functional.communityPlatform.member.communities.erase(
      connection,
      {
        communityName: community.name,
      },
    );
  });
}
