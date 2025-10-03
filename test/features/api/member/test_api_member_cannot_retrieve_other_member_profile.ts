import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunityPlatformMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformMember";
import type { IMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IMember";

export async function test_api_member_cannot_retrieve_other_member_profile(
  connection: api.IConnection,
) {
  // 1. Create first member account (attacker)
  const attackerEmail: string = typia.random<string & tags.Format<"email">>();
  const attacker: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: attackerEmail,
        password_hash: "fake_hash_123",
      } satisfies IMember.IJoin,
    });
  typia.assert(attacker);

  // 2. Create second member account (victim)
  const victimEmail: string = typia.random<string & tags.Format<"email">>();
  const victim: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: victimEmail,
        password_hash: "fake_hash_456",
      } satisfies IMember.IJoin,
    });
  typia.assert(victim);

  // 3. Attempt to retrieve victim's profile using attacker's connection
  // This should fail with 403 Forbidden or 404 Not Found
  await TestValidator.error(
    "regular member cannot retrieve other member's profile",
    async () => {
      await api.functional.communityPlatform.admin.members.at(connection, {
        memberId: victim.id,
      });
    },
  );
}
