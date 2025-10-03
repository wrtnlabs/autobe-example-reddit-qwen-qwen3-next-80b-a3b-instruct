import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunityPlatformCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunity";
import type { ICommunityPlatformCommunityPlatformUserCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunityPlatformUserCommunity";
import type { ICommunityPlatformIPageICommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformIPageICommunity";
import type { ICommunityPlatformMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformMember";
import type { ICommunityPlatformPost } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformPost";
import type { IMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IMember";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";

export async function test_api_member_recent_communities_ordered_by_last_interaction(
  connection: api.IConnection,
) {
  // Step 1: Create member account
  const memberEmail = typia.random<string & tags.Format<"email">>();
  const member: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: memberEmail,
        password_hash: "hashed_password_here",
      } satisfies IMember.IJoin,
    });
  typia.assert(member);

  // Step 2: Create three distinct communities
  const community1Name = typia.random<
    string &
      tags.MinLength<5> &
      tags.MaxLength<64> &
      tags.Pattern<"^[a-zA-Z0-9_-]+$">
  >();
  const community1: ICommunityPlatformCommunity =
    await api.functional.communityPlatform.member.communities.create(
      connection,
      {
        body: {
          name: community1Name,
          category: "Tech & Programming",
        } satisfies ICommunityPlatformCommunity.ICreate,
      },
    );
  typia.assert(community1);

  const community2Name = typia.random<
    string &
      tags.MinLength<5> &
      tags.MaxLength<64> &
      tags.Pattern<"^[a-zA-Z0-9_-]+$">
  >();
  const community2: ICommunityPlatformCommunity =
    await api.functional.communityPlatform.member.communities.create(
      connection,
      {
        body: {
          name: community2Name,
          category: "Science",
        } satisfies ICommunityPlatformCommunity.ICreate,
      },
    );
  typia.assert(community2);

  const community3Name = typia.random<
    string &
      tags.MinLength<5> &
      tags.MaxLength<64> &
      tags.Pattern<"^[a-zA-Z0-9_-]+$">
  >();
  const community3: ICommunityPlatformCommunity =
    await api.functional.communityPlatform.member.communities.create(
      connection,
      {
        body: {
          name: community3Name,
          category: "Movies & TV",
        } satisfies ICommunityPlatformCommunity.ICreate,
      },
    );
  typia.assert(community3);

  // Step 3: Join all three communities
  const membership1: ICommunityPlatformCommunityPlatformUserCommunity =
    await api.functional.communityPlatform.member.communities.members.create(
      connection,
      {
        communityName: community1Name,
      },
    );
  typia.assert(membership1);

  const membership2: ICommunityPlatformCommunityPlatformUserCommunity =
    await api.functional.communityPlatform.member.communities.members.create(
      connection,
      {
        communityName: community2Name,
      },
    );
  typia.assert(membership2);

  const membership3: ICommunityPlatformCommunityPlatformUserCommunity =
    await api.functional.communityPlatform.member.communities.members.create(
      connection,
      {
        communityName: community3Name,
      },
    );
  typia.assert(membership3);

  // Step 4: Post in the earliest joined community (community1) to update last_interaction_at
  const post: ICommunityPlatformPost =
    await api.functional.communityPlatform.member.posts.create(connection, {
      body: {
        community_id: community1.id,
        title: RandomGenerator.paragraph({ sentences: 1 }),
        body: RandomGenerator.content({ paragraphs: 2 }),
      } satisfies ICommunityPlatformPost.ICreate,
    });
  typia.assert(post);

  // Step 5: Retrieve recent communities
  const recentCommunities: ICommunityPlatformIPageICommunity.ISummary =
    await api.functional.communityPlatform.member.users.communities.getByUserid(
      connection,
      {
        userId: member.id,
      },
    );
  typia.assert(recentCommunities);

  // Step 6: Validate response structure and ordering
  TestValidator.equals(
    "pagination contains correct limit",
    recentCommunities.pagination.limit,
    5,
  );
  TestValidator.equals(
    "pagination contains correct current page",
    recentCommunities.pagination.current,
    0,
  );
  TestValidator.equals(
    "pagination contains correct total records",
    recentCommunities.pagination.records,
    3,
  );
  TestValidator.equals(
    "pagination contains correct total pages",
    recentCommunities.pagination.pages,
    1,
  );
  TestValidator.equals(
    "total communities returned",
    recentCommunities.data.length,
    3,
  );

  // Community sorting assertion: The community with the most recent interaction (community1) should be first
  TestValidator.equals(
    "most recently active community appears first",
    recentCommunities.data[0].id,
    community1.id,
  );

  // For the remaining communities: performance is key. We joined community2 before community3, so community3 has a more recent join timestamp (last_interaction_at).
  // Since we did not interact with community2 or community3 after joining, their last_interaction_at reflects their join time.
  // Therefore community3 should appear before community2 (descending order by last_interaction_at).
  TestValidator.equals(
    "second most recent community is community3",
    recentCommunities.data[1].id,
    community3.id,
  );
  TestValidator.equals(
    "third most recent community is community2",
    recentCommunities.data[2].id,
    community2.id,
  );

  // Ensure all returned communities are from the ones created and joined
  const createdCommunityIds = [community1.id, community2.id, community3.id];
  for (const community of recentCommunities.data) {
    TestValidator.predicate(
      "community ID matches a created community",
      createdCommunityIds.includes(community.id),
    );
  }
}
