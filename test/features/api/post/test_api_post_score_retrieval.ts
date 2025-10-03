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

export async function test_api_post_score_retrieval(
  connection: api.IConnection,
) {
  // Step 1: Authenticate a member to create a post
  const memberEmail: string = typia.random<string & tags.Format<"email">>();
  const member: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: memberEmail,
        password_hash: "hashed_password_123",
      } satisfies IMember.IJoin,
    });
  typia.assert(member);

  // Step 2: Create a community to post in
  const community: ICommunityPlatformCommunity =
    await api.functional.communityPlatform.member.communities.create(
      connection,
      {
        body: {
          name: RandomGenerator.alphaNumeric(10),
          category: "Tech & Programming",
          description: RandomGenerator.paragraph(),
        } satisfies ICommunityPlatformCommunity.ICreate,
      },
    );
  typia.assert(community);

  // Step 3: Create a post to track score
  const post: ICommunityPlatformPost =
    await api.functional.communityPlatform.member.posts.create(connection, {
      body: {
        community_id: community.id,
        title: RandomGenerator.paragraph({
          sentences: 5,
          wordMin: 3,
          wordMax: 8,
        }),
        body: RandomGenerator.content({
          paragraphs: 2,
          sentenceMin: 10,
          sentenceMax: 15,
        }),
      } satisfies ICommunityPlatformPost.ICreate,
    });
  typia.assert(post);

  // Step 4: Authenticate multiple member users to vote on the post
  const voters = ArrayUtil.repeat(5, () => {
    const email = typia.random<string & tags.Format<"email">>();
    return api.functional.auth.member.join(connection, {
      body: {
        email: email,
        password_hash: "hashed_password_123",
      } satisfies IMember.IJoin,
    });
  });
  const votersData = await Promise.all(voters);
  typia.assert(votersData);

  // Step 5: Cast upvotes and downvotes on the post
  const upvotes = ArrayUtil.repeat(3, async () => {
    const voter = RandomGenerator.pick(votersData);
    await api.functional.communityPlatform.member.posts.votes.create(
      connection,
      {
        postId: post.id,
        body: {
          vote_state: "upvote",
        } satisfies ICommunityPlatformPost.ICreateVote,
      },
    );
  });
  const downvotes = ArrayUtil.repeat(2, async () => {
    const voter = RandomGenerator.pick(votersData);
    await api.functional.communityPlatform.member.posts.votes.create(
      connection,
      {
        postId: post.id,
        body: {
          vote_state: "downvote",
        } satisfies ICommunityPlatformPost.ICreateVote,
      },
    );
  });
  await Promise.all([...upvotes, ...downvotes]);

  // Step 6: Retrieve the post score and validate it
  const score: ICommunityPlatformPostScore =
    await api.functional.communityPlatform.analytics.posts.score.at(
      connection,
      {
        postId: post.id,
      },
    );
  typia.assert(score);

  // Validate that the total score equals upvotes minus downvotes (3 - 2 = 1)
  TestValidator.equals(
    "post score equals calculated difference",
    score.score,
    1,
  );
}
