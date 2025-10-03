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

export async function test_api_post_score_increment_on_upvote(
  connection: api.IConnection,
) {
  // 1. Create member account
  const memberEmail: string = typia.random<string & tags.Format<"email">>();
  const member: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: memberEmail,
        password_hash:
          "$2a$10$eI8e5K6e0Xq1kU9tKZf83O6Y5J1jZp9V2X1m4Z7g9K5l1J3k5T7v7", // Valid bcrypt hash format
      } satisfies IMember.IJoin,
    });
  typia.assert(member);

  // 2. Create community
  const communityName: string = RandomGenerator.alphaNumeric(10);
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

  // 3. Create post
  const post: ICommunityPlatformPost =
    await api.functional.communityPlatform.member.posts.create(connection, {
      body: {
        community_id: community.id,
        title: RandomGenerator.paragraph(),
        body: RandomGenerator.content(),
      } satisfies ICommunityPlatformPost.ICreate,
    });
  typia.assert(post);

  // 4. Upvote the post
  await api.functional.communityPlatform.member.posts.votes.create(connection, {
    postId: post.id,
    body: {
      vote_state: "upvote",
    } satisfies ICommunityPlatformPost.ICreateVote,
  });

  // 5. Verify post score increment
  const score: ICommunityPlatformPostScore =
    await api.functional.communityPlatform.analytics.posts.score.at(
      connection,
      {
        postId: post.id,
      },
    );
  typia.assert(score);
  TestValidator.equals("post score should be 1 after upvote", score.score, 1);
}
