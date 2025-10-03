import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunityPlatformCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunity";
import type { ICommunityPlatformMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformMember";
import type { ICommunityPlatformPost } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformPost";
import type { IMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IMember";

export async function test_api_vote_on_post_by_member(
  connection: api.IConnection,
) {
  // 1. Authenticate as member
  const memberEmail: string = typia.random<string & tags.Format<"email">>();
  const member: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: memberEmail,
        password_hash: typia.random<string>(),
      } satisfies IMember.IJoin,
    });
  typia.assert(member);

  // 2. Create a community
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

  // 3. Create a post by the same member
  const post: ICommunityPlatformPost =
    await api.functional.communityPlatform.member.posts.create(connection, {
      body: {
        community_id: community.id,
        title: RandomGenerator.paragraph({ sentences: 2 }),
        body: RandomGenerator.content({ paragraphs: 1 }),
      } satisfies ICommunityPlatformPost.ICreate,
    });
  typia.assert(post);

  // 4. Verify member cannot vote on their own post
  await TestValidator.error("member cannot vote on own post", async () => {
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

  // 5. Create a second member for voting
  const voterEmail: string = typia.random<string & tags.Format<"email">>();
  const voter: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: voterEmail,
        password_hash: typia.random<string>(),
      } satisfies IMember.IJoin,
    });
  typia.assert(voter);

  // 6. Vote up on post (none → upvote)
  await api.functional.communityPlatform.member.posts.votes.create(connection, {
    postId: post.id,
    body: { vote_state: "upvote" } satisfies ICommunityPlatformPost.ICreateVote,
  });

  // 7. Toggle vote to downvote (upvote → downvote)
  await api.functional.communityPlatform.member.posts.votes.create(connection, {
    postId: post.id,
    body: {
      vote_state: "downvote",
    } satisfies ICommunityPlatformPost.ICreateVote,
  });

  // 8. Toggle vote to none (downvote → none)
  await api.functional.communityPlatform.member.posts.votes.create(connection, {
    postId: post.id,
    body: {
      vote_state: "downvote",
    } satisfies ICommunityPlatformPost.ICreateVote,
  });

  // 9. Verify unauthenticated user cannot vote
  const unauthConn: api.IConnection = { ...connection, headers: {} };
  await TestValidator.error("unauthenticated user cannot vote", async () => {
    await api.functional.communityPlatform.member.posts.votes.create(
      unauthConn,
      {
        postId: post.id,
        body: {
          vote_state: "upvote",
        } satisfies ICommunityPlatformPost.ICreateVote,
      },
    );
  });
}
