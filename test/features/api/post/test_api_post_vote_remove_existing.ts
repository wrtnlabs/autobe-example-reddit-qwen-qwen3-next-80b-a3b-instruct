import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunityPlatformCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunity";
import type { ICommunityPlatformMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformMember";
import type { ICommunityPlatformPost } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformPost";
import type { IMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IMember";

export async function test_api_post_vote_remove_existing(
  connection: api.IConnection,
) {
  // 1. Authenticate member user
  const user: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: typia.random<string & tags.Format<"email">>(),
        password_hash: "hashedPassword123",
      } satisfies IMember.IJoin,
    });
  typia.assert(user);

  // 2. Create a community
  const community: ICommunityPlatformCommunity =
    await api.functional.communityPlatform.member.communities.create(
      connection,
      {
        body: {
          name: RandomGenerator.alphabets(10),
          category: "Tech & Programming",
        } satisfies ICommunityPlatformCommunity.ICreate,
      },
    );
  typia.assert(community);

  // 3. Create a post in the community
  const post: ICommunityPlatformPost =
    await api.functional.communityPlatform.member.posts.create(connection, {
      body: {
        community_id: community.id,
        title: RandomGenerator.paragraph({ sentences: 5 }),
        body: RandomGenerator.content({ paragraphs: 2 }),
      } satisfies ICommunityPlatformPost.ICreate,
    });
  typia.assert(post);

  // 4. Create an initial upvote on the post
  await api.functional.communityPlatform.member.posts.votes.create(connection, {
    postId: post.id,
    body: {
      vote_state: "upvote",
    } satisfies ICommunityPlatformPost.ICreateVote,
  });

  // 5. Remove the vote on the post
  const removeVoteResult =
    await api.functional.communityPlatform.member.posts.votes.erase(
      connection,
      {
        postId: post.id,
      },
    );
  typia.assert(removeVoteResult);

  // 6. Verify idempotency: remove vote again (should still succeed)
  await api.functional.communityPlatform.member.posts.votes.erase(connection, {
    postId: post.id,
  });
}
