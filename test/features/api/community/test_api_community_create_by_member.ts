import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunityPlatformCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunity";
import type { ICommunityPlatformMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformMember";
import type { IMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IMember";

export async function test_api_community_create_by_member(
  connection: api.IConnection,
) {
  // Step 1: Authenticate as member to create community
  const memberEmail: string = typia.random<string & tags.Format<"email">>();
  const memberJoinData = {
    email: memberEmail,
    password_hash: "hash1234567890",
  } satisfies IMember.IJoin;

  const member: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: memberJoinData,
    });
  typia.assert(member);

  // Step 2: Create a new community with valid data
  const communityName = "dev-resources";
  const communityData = {
    name: communityName,
    category: "Tech & Programming",
    description: "A community for developers to share resources and knowledge",
    rules: "1. Be respectful\n2. No spam\n3. Stay on topic",
  } satisfies ICommunityPlatformCommunity.ICreate;

  const createdCommunity: ICommunityPlatformCommunity =
    await api.functional.communityPlatform.member.communities.create(
      connection,
      {
        body: communityData,
      },
    );
  typia.assert(createdCommunity);

  // Validate community creation response
  TestValidator.equals(
    "community name matches",
    createdCommunity.name,
    communityName,
  );
  TestValidator.equals(
    "community category matches",
    createdCommunity.category,
    "Tech & Programming",
  );
  TestValidator.equals("member count is 1", createdCommunity.member_count, 1);

  // Step 3: Attempt to create a duplicate community name (should fail with 409 Conflict)
  await TestValidator.error(
    "duplicate community name should return 409 Conflict",
    async () => {
      await api.functional.communityPlatform.member.communities.create(
        connection,
        {
          body: {
            name: communityName,
            category: "Tech & Programming",
          } satisfies ICommunityPlatformCommunity.ICreate,
        },
      );
    },
  );
}
