import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunityPlatformCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunity";
import type { ICommunityPlatformCommunityPlatformUserCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunityPlatformUserCommunity";
import type { ICommunityPlatformMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformMember";
import type { IMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IMember";

export async function test_api_community_join_after_deletion(
  connection: api.IConnection,
) {
  // Step 1: Create community creator account
  const creatorEmail: string = typia.random<string & tags.Format<"email">>();
  const creator: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: creatorEmail,
        password_hash: "hashed_password_123",
      } satisfies IMember.IJoin,
    });
  typia.assert(creator);

  // Step 2: Create the community to be deleted
  const communityName: string =
    "test-community-" + RandomGenerator.alphaNumeric(8);
  const community: ICommunityPlatformCommunity =
    await api.functional.communityPlatform.member.communities.create(
      connection,
      {
        body: {
          name: communityName,
          category: "Tech & Programming",
          description: "A test community for deletion scenario",
        } satisfies ICommunityPlatformCommunity.ICreate,
      },
    );
  typia.assert(community);
  TestValidator.equals("community name matches", community.name, communityName);

  // Step 3: Permanently delete the community
  await api.functional.communityPlatform.member.communities.erase(connection, {
    communityName,
  });

  // Step 4: Create a separate member account to attempt joining the deleted community
  const memberEmail: string = typia.random<string & tags.Format<"email">>();
  const member: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: memberEmail,
        password_hash: "hashed_password_456",
      } satisfies IMember.IJoin,
    });
  typia.assert(member);

  // Step 5: Attempt to join the deleted community
  // Expect 404 Not Found error since community no longer exists
  await TestValidator.httpError(
    "should fail with 404 when joining deleted community",
    404,
    async () => {
      await api.functional.communityPlatform.member.communities.members.create(
        connection,
        {
          communityName,
        },
      );
    },
  );
}
