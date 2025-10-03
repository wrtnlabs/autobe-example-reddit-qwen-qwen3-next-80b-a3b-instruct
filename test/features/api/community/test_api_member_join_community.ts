import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunityPlatformCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunity";
import type { ICommunityPlatformCommunityPlatformUserCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunityPlatformUserCommunity";
import type { ICommunityPlatformMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformMember";
import type { IMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IMember";

export async function test_api_member_join_community(
  connection: api.IConnection,
) {
  // 1. Authenticate as member
  const memberEmail: string = typia.random<string & tags.Format<"email">>();
  const member: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: memberEmail,
        password_hash: "hashed_password_123",
      } satisfies IMember.IJoin,
    });
  typia.assert(member);

  // 2. Create a community
  const communityName: string = typia.random<
    string &
      tags.MinLength<5> &
      tags.MaxLength<64> &
      tags.Pattern<"^[a-zA-Z0-9_-]+$">
  >();
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
  TestValidator.equals("community name matches", community.name, communityName);
  TestValidator.equals(
    "community category matches",
    community.category,
    "Tech & Programming",
  );
  const initialMemberCount = community.member_count;
  TestValidator.equals("member count starts at 1", initialMemberCount, 1);

  // 3. Join the community
  const membership: ICommunityPlatformCommunityPlatformUserCommunity =
    await api.functional.communityPlatform.member.communities.members.create(
      connection,
      {
        communityName: communityName,
      },
    );
  typia.assert(membership);

  // 4. Validate the membership record
  TestValidator.equals(
    "membership community_id matches created community",
    membership.community_platform_community_id,
    community.id,
  );
  TestValidator.equals(
    "membership user_id matches authenticated member",
    membership.community_platform_user_id,
    member.id,
  );
  TestValidator.equals(
    "membership deleted_at is null",
    membership.deleted_at,
    null,
  );
  TestValidator.predicate(
    "membership created_at is valid ISO date-time",
    () => {
      return !isNaN(Date.parse(membership.created_at));
    },
  );
  TestValidator.predicate(
    "membership last_interaction_at is valid ISO date-time",
    () => {
      return !isNaN(Date.parse(membership.last_interaction_at));
    },
  );

  // 5. Verify community member count increased after join
  const updatedCommunity: ICommunityPlatformCommunity =
    await api.functional.communityPlatform.member.communities.create(
      connection,
      {
        body: {
          name: communityName,
          category: "Tech & Programming",
        } satisfies ICommunityPlatformCommunity.ICreate,
      },
    );
  typia.assert(updatedCommunity);
  TestValidator.equals(
    "community member count increased by 1 after join",
    updatedCommunity.member_count,
    initialMemberCount + 1,
  );
}
