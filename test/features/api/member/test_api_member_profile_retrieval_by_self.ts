import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunityPlatformMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformMember";
import type { IMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IMember";

export async function test_api_member_profile_retrieval_by_self(
  connection: api.IConnection,
) {
  // 1. Create a new member account
  const email = typia.random<string & tags.Format<"email">>();
  const joinResponse: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email,
        password_hash: "hashed_password_123",
      } satisfies IMember.IJoin,
    });
  typia.assert(joinResponse);

  // 2. Retrieve the member's profile using the generated memberId
  const memberId = joinResponse.id;
  const profileResponse: ICommunityPlatformMember =
    await api.functional.communityPlatform.member.members.at(connection, {
      memberId,
    });
  typia.assert(profileResponse);

  // 3. Validate the retrieved profile contains correct information
  TestValidator.equals(
    "retrieved email matches created email",
    profileResponse.email,
    email,
  );
  TestValidator.predicate(
    "created_at is defined and valid",
    profileResponse.created_at !== undefined,
  );
  TestValidator.predicate(
    "password_hash is not in the response",
    !("password_hash" in profileResponse),
  );
  TestValidator.equals(
    "display_name is undefined by default",
    profileResponse.display_name,
    undefined,
  );
}
