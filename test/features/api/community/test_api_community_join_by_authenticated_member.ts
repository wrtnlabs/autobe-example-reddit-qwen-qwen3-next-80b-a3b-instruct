import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunitybbsAdministrator } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsAdministrator";
import type { ICommunitybbsCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsCommunity";
import type { ICommunitybbsMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsMember";
import type { IMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IMember";

export async function test_api_community_join_by_authenticated_member(
  connection: api.IConnection,
) {
  // Generate a valid UUID for a community that is assumed to exist
  const communityId = typia.random<string & tags.Format<"uuid">>();

  // Step 1: Join the community - should succeed with valid UUID (assuming community exists)
  const joinResponse: void = await api.functional.communities.join.create(
    connection,
    {
      communityId,
    },
  );
  typia.assert(joinResponse);

  // Step 2: Idempotency - join the same community again
  // The join action should be idempotent and not fail
  const secondJoinResponse: void = await api.functional.communities.join.create(
    connection,
    {
      communityId,
    },
  );
  typia.assert(secondJoinResponse);

  // Step 3: Test with invalid communityId format
  await TestValidator.error(
    "joining with invalid UUID format should fail",
    async () => {
      await api.functional.communities.join.create(connection, {
        communityId: "this-is-not-a-uuid", // Invalid UUID format
      });
    },
  );

  // Step 4: Test with empty communityId (too short)
  await TestValidator.error(
    "joining with empty communityId should fail",
    async () => {
      await api.functional.communities.join.create(connection, {
        communityId: "", // Empty string
      });
    },
  );
}
