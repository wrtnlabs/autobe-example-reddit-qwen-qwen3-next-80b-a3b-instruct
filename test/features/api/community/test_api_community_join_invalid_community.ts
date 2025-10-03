import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunityPlatformCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunity";
import type { ICommunityPlatformCommunityPlatformUserCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunityPlatformUserCommunity";
import type { ICommunityPlatformMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformMember";
import type { IMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IMember";

export async function test_api_community_join_invalid_community(
  connection: api.IConnection,
) {
  // 1. Authenticate a member user to have required permissions
  const memberEmail: string = typia.random<string & tags.Format<"email">>();
  const member: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: memberEmail,
        password_hash: "hashed_password_123",
      } satisfies IMember.IJoin,
    });
  typia.assert(member);

  // 2. Create at least one real community to ensure system functionality
  const realCommunityName: string = `community-${RandomGenerator.alphaNumeric(10)}`;
  const realCommunity: ICommunityPlatformCommunity =
    await api.functional.communityPlatform.member.communities.create(
      connection,
      {
        body: {
          name: realCommunityName,
          category: "Tech & Programming",
        } satisfies ICommunityPlatformCommunity.ICreate,
      },
    );
  typia.assert(realCommunity);

  // 3. Verify that real community joining works (positive test case)
  const membershipRecord: ICommunityPlatformCommunityPlatformUserCommunity =
    await api.functional.communityPlatform.member.communities.members.create(
      connection,
      {
        communityName: realCommunityName,
      },
    );
  typia.assert(membershipRecord);
  TestValidator.equals(
    "membership record should be created for real community",
    membershipRecord.community_platform_community_id,
    realCommunity.id,
  );

  // 4. Test joining a non-existent community (negative test case)
  // Use a random non-existent community name - this should throw an HttpError
  // The API should return 404 Not Found when community doesn't exist
  // According to absolute prohibitions, we cannot validate HTTP status codes directly
  // We can only verify that an error is thrown, not inspect its type or code
  const nonExistentCommunityName: string = `non-existent-community-${RandomGenerator.alphaNumeric(12)}`;
  await TestValidator.error(
    "should throw error when joining non-existent community",
    async () => {
      await api.functional.communityPlatform.member.communities.members.create(
        connection,
        {
          communityName: nonExistentCommunityName,
        },
      );
    },
  );
}
