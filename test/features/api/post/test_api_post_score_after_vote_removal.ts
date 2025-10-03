import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunityPlatformCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunity";
import type { ICommunityPlatformMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformMember";
import type { ICommunityPlatformPost } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformPost";
import type { ICommunityPlatformPostScore } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformPostScore";
import type { IMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IMember";

export async function test_api_post_score_after_vote_removal(
  connection: api.IConnection,
) {
  // 1. Authenticate as creator to create post
  const creatorEmail: string = typia.random<string & tags.Format<"email">>();
  const creator: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: creatorEmail,
        password_hash: "hash123",
      } satisfies IMember.IJoin,
    });
  typia.assert(creator);

  // 2. Create community for post
  const communityName = RandomGenerator.alphabets(10);
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

  // 3. Create post to test vote removal
  const post: ICommunityPlatformPost =
    await api.functional.communityPlatform.member.posts.create(connection, {
      body: {
        community_id: community.id,
        title: RandomGenerator.paragraph({ sentences: 5 }),
        body: RandomGenerator.content({ paragraphs: 2 }),
      } satisfies ICommunityPlatformPost.ICreate,
    });
  typia.assert(post);

  // 4. Authenticate as member to vote (different user)
  const memberEmail: string = typia.random<string & tags.Format<"email">>();
  const member: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: memberEmail,
        password_hash: "hash456",
      } satisfies IMember.IJoin,
    });
  typia.assert(member);

  // 5. Member upvotes the post
  await api.functional.communityPlatform.member.posts.votes.create(connection, {
    postId: post.id,
    body: {
      vote_state: "upvote",
    } satisfies ICommunityPlatformPost.ICreateVote,
  });

  // 6. Check initial score is 1
  const initialScore: ICommunityPlatformPostScore =
    await api.functional.communityPlatform.analytics.posts.score.at(
      connection,
      {
        postId: post.id,
      },
    );
  typia.assert(initialScore);
  TestValidator.equals("initial score should be 1", initialScore.score, 1);

  // 7. Member removes their vote entirely
  await api.functional.communityPlatform.member.posts.votes.erase(connection, {
    postId: post.id,
  });

  // 8. Confirm score returns to 0
  const finalScore: ICommunityPlatformPostScore =
    await api.functional.communityPlatform.analytics.posts.score.at(
      connection,
      {
        postId: post.id,
      },
    );
  typia.assert(finalScore);
  TestValidator.equals(
    "final score should be 0 after vote removal",
    finalScore.score,
    0,
  );
}
