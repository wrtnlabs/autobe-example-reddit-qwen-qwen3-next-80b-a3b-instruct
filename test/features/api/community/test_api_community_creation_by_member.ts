import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunityPlatformCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunity";
import type { ICommunityPlatformMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformMember";
import type { IMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IMember";

export async function test_api_community_creation_by_member(
  connection: api.IConnection,
) {
  // Step 1: Authenticate as member to create community
  const memberEmail: string = typia.random<string & tags.Format<"email">>();
  const member: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: memberEmail,
        password_hash: "hashed_password_123",
      } satisfies IMember.IJoin,
    });
  typia.assert(member);

  // Step 2: Create a new community with valid metadata
  const communityName: string =
    RandomGenerator.alphabets(6) + "_test_community";
  const community: ICommunityPlatformCommunity =
    await api.functional.communityPlatform.member.communities.create(
      connection,
      {
        body: {
          name: communityName,
          category: "Tech & Programming",
          description: "A community for tech enthusiasts and programmers.",
        } satisfies ICommunityPlatformCommunity.ICreate,
      },
    );
  typia.assert(community);

  // Step 3: Validate community business logic properties
  TestValidator.equals("community name matches", community.name, communityName);
  TestValidator.equals(
    "community category matches",
    community.category,
    "Tech & Programming",
  );
  TestValidator.equals(
    "community description matches",
    community.description,
    "A community for tech enthusiasts and programmers.",
  );
}
