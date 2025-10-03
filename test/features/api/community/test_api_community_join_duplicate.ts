import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunityPlatformCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunity";
import type { ICommunityPlatformCommunityPlatformUserCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunityPlatformUserCommunity";
import type { ICommunityPlatformMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformMember";
import type { IMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IMember";

export async function test_api_community_join_duplicate(
  connection: api.IConnection,
) {
  // Step 1: Authenticate a member
  const memberEmail = typia.random<string & tags.Format<"email">>();
  // Using a valid bcrypt hash format as required by IMember.IJoin
  // A real bcrypt hash is 60 characters including $2a$, $2y$, $2b$, or $2x$ prefix
  const memberPasswordHash =
    "$2a$10$A5FwJ4j6eV5W7sGZj.CZTuRSTuS2TVs02QaYQqe4T4ACBNkDWShY2";
  const member: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: memberEmail,
        password_hash: memberPasswordHash,
      } satisfies IMember.IJoin,
    });
  typia.assert(member);

  // Step 2: Create a community
  const communityName = `test-community-${RandomGenerator.alphaNumeric(8)}`;
  const community: ICommunityPlatformCommunity =
    await api.functional.communityPlatform.member.communities.create(
      connection,
      {
        body: {
          name: communityName,
          category: "Tech & Programming",
        } satisfies ICommunityPlatformCommunity.ICreate,
      },
    );
  typia.assert(community);

  // Step 3: Join the community (first time)
  const firstMembership: ICommunityPlatformCommunityPlatformUserCommunity =
    await api.functional.communityPlatform.member.communities.members.create(
      connection,
      {
        communityName: communityName,
      },
    );
  typia.assert(firstMembership);

  // Step 4: Attempt to join the same community again (duplicate join)
  await TestValidator.error(
    "duplicate community join should fail with 409 Conflict",
    async () => {
      await api.functional.communityPlatform.member.communities.members.create(
        connection,
        {
          communityName: communityName,
        },
      );
    },
  );
}
