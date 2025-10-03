import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunityPlatformCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunity";
import type { ICommunityPlatformMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformMember";
import type { IMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IMember";

export async function test_api_community_update_by_creator(
  connection: api.IConnection,
) {
  // Create a new member account
  const memberEmail = typia.random<string & tags.Format<"email">>();
  const member: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: memberEmail,
        password_hash: "hashed_password_here",
      } satisfies IMember.IJoin,
    });
  typia.assert(member);

  // Create a new community owned by the member
  const communityName = RandomGenerator.alphaNumeric(10);
  const community: ICommunityPlatformCommunity =
    await api.functional.communityPlatform.member.communities.create(
      connection,
      {
        body: {
          name: communityName,
          category: "Tech & Programming",
          description: "Original description",
          rules: "Original rule 1\nOriginal rule 2",
          logo_url: "https://example.com/original-logo.png",
          banner_url: "https://example.com/original-banner.png",
        } satisfies ICommunityPlatformCommunity.ICreate,
      },
    );
  typia.assert(community);

  // Update the community with partial data
  const updatedCommunity: ICommunityPlatformCommunity =
    await api.functional.communityPlatform.member.communities.update(
      connection,
      {
        communityName,
        body: {
          description: "Updated description",
          logo_url: "https://example.com/updated-logo.png",
        } satisfies ICommunityPlatformCommunity.IUpdate,
      },
    );
  typia.assert(updatedCommunity);

  // Validate that only updated fields changed and others remained unchanged
  TestValidator.equals(
    "description was updated",
    updatedCommunity.description,
    "Updated description",
  );
  TestValidator.equals(
    "logo_url was updated",
    updatedCommunity.logo_url,
    "https://example.com/updated-logo.png",
  );
  TestValidator.equals(
    "rules remained unchanged",
    updatedCommunity.rules,
    "Original rule 1\nOriginal rule 2",
  );
  TestValidator.equals(
    "banner_url remained unchanged",
    updatedCommunity.banner_url,
    "https://example.com/original-banner.png",
  );
  TestValidator.predicate(
    "community name remained unchanged",
    updatedCommunity.name === communityName,
  );

  // Create a second member to test unauthorized access
  const otherMemberEmail = typia.random<string & tags.Format<"email">>();
  await api.functional.auth.member.join(connection, {
    body: {
      email: otherMemberEmail,
      password_hash: "hashed_password_here",
    } satisfies IMember.IJoin,
  });

  // Attempt update as non-creator should fail with 403 Forbidden
  await TestValidator.error("non-creator cannot update community", async () => {
    await api.functional.communityPlatform.member.communities.update(
      connection,
      {
        communityName,
        body: {
          description: "Hacked description",
        } satisfies ICommunityPlatformCommunity.IUpdate,
      },
    );
  });
}
