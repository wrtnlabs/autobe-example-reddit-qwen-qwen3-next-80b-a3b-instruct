import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunityPlatformCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunity";
import type { ICommunityPlatformMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformMember";
import type { IMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IMember";

export async function test_api_community_creation_duplicate_name(
  connection: api.IConnection,
) {
  // Step 1: Authenticate a member user to create a community
  const memberEmail: string = typia.random<string & tags.Format<"email">>();
  const memberPassword: string = "SecurePass123";
  const authenticatedMember: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: memberEmail,
        password_hash: memberPassword,
      } satisfies IMember.IJoin,
    });
  typia.assert(authenticatedMember);

  // Step 2: Create an initial community with a unique name
  const initialCommunityName: string =
    "unique-community-name-" + RandomGenerator.alphaNumeric(6);
  const initialCommunity: ICommunityPlatformCommunity =
    await api.functional.communityPlatform.member.communities.create(
      connection,
      {
        body: {
          name: initialCommunityName,
          category: "Tech & Programming",
        } satisfies ICommunityPlatformCommunity.ICreate,
      },
    );
  typia.assert(initialCommunity);
  TestValidator.equals(
    "Initial community name matches",
    initialCommunity.name,
    initialCommunityName,
  );

  // Step 3: Attempt to create another community with the same name - should fail with 409 Conflict
  await TestValidator.error(
    "Creating duplicate community name should fail with 409 Conflict",
    async () => {
      await api.functional.communityPlatform.member.communities.create(
        connection,
        {
          body: {
            name: initialCommunityName, // Exact duplicate of existing name
            category: "Tech & Programming",
          } satisfies ICommunityPlatformCommunity.ICreate,
        },
      );
    },
  );
}
