import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunityPlatformCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunity";
import type { ICommunityPlatformMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformMember";
import type { ICommunityPlatformPost } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformPost";
import type { IMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IMember";

export async function test_api_post_vote_duplicate(
  connection: api.IConnection,
) {
  // Step 1: Authenticate member user 1 (post creator)
  const member1Email: string = typia.random<string & tags.Format<"email">>();
  const member1: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: member1Email,
        password_hash: RandomGenerator.alphaNumeric(100),
      } satisfies IMember.IJoin,
    });
  typia.assert(member1);

  // Step 2: Create a community
  const community: ICommunityPlatformCommunity =
    await api.functional.communityPlatform.member.communities.create(
      connection,
      {
        body: {
          name: RandomGenerator.alphaNumeric(10),
          category: "Tech & Programming",
        } satisfies ICommunityPlatformCommunity.ICreate,
      },
    );
  typia.assert(community);

  // Step 3: Create a post as member 1
  const post: ICommunityPlatformPost =
    await api.functional.communityPlatform.member.posts.create(connection, {
      body: {
        community_id: community.id,
        title: RandomGenerator.paragraph({ sentences: 3 }),
        body: RandomGenerator.content({ paragraphs: 1 }),
      } satisfies ICommunityPlatformPost.ICreate,
    });
  typia.assert(post);

  // Step 4: Sign out member 1 and authenticate member 2 (voter)
  const member2Email: string = typia.random<string & tags.Format<"email">>();
  const member2: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: member2Email,
        password_hash: RandomGenerator.alphaNumeric(100),
      } satisfies IMember.IJoin,
    });
  typia.assert(member2);

  // Step 5: Vote up on post (should create upvote)
  await api.functional.communityPlatform.member.posts.votes.create(connection, {
    postId: post.id,
    body: { vote_state: "upvote" } satisfies ICommunityPlatformPost.ICreateVote,
  });

  // Step 6: Vote up again on the same post (should remove vote)
  await api.functional.communityPlatform.member.posts.votes.create(connection, {
    postId: post.id,
    body: { vote_state: "upvote" } satisfies ICommunityPlatformPost.ICreateVote,
  });

  // Step 7: Vote up once more on the same post (should create upvote again)
  await api.functional.communityPlatform.member.posts.votes.create(connection, {
    postId: post.id,
    body: { vote_state: "upvote" } satisfies ICommunityPlatformPost.ICreateVote,
  });

  // The system should handle the vote transitions correctly without creating duplicate records,
  // and all operations should complete without errors.
  // Since the API returns void and there's no endpoint to check vote count,
  // we validate that each vote operation completes successfully.
}
