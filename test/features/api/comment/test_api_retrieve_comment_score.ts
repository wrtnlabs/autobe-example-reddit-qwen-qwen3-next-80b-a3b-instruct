import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunityPlatformComment } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformComment";
import type { ICommunityPlatformCommentScore } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommentScore";
import type { ICommunityPlatformCommentVoteRequest } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommentVoteRequest";
import type { ICommunityPlatformCommentVoteResponse } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommentVoteResponse";
import type { ICommunityPlatformCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunity";
import type { ICommunityPlatformMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformMember";
import type { ICommunityPlatformPost } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformPost";
import type { IMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IMember";

export async function test_api_retrieve_comment_score(
  connection: api.IConnection,
) {
  // Step 1: Authenticate a member to create content and vote
  const memberEmail = typia.random<string & tags.Format<"email">>();
  const member: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: memberEmail,
        password_hash: "hashed_password_123",
      } satisfies IMember.IJoin,
    });
  typia.assert(member);

  // Step 2: Create a community for the post
  const community: ICommunityPlatformCommunity =
    await api.functional.communityPlatform.member.communities.create(
      connection,
      {
        body: {
          name: RandomGenerator.alphabets(10),
          category: "Science",
        } satisfies ICommunityPlatformCommunity.ICreate,
      },
    );
  typia.assert(community);

  // Step 3: Create a post in the community
  const post: ICommunityPlatformPost =
    await api.functional.communityPlatform.member.posts.create(connection, {
      body: {
        community_id: community.id,
        title: RandomGenerator.paragraph({ sentences: 3 }),
        body: RandomGenerator.content({ paragraphs: 1 }),
      } satisfies ICommunityPlatformPost.ICreate,
    });
  typia.assert(post);

  // Step 4: Create a comment on the post
  const comment: ICommunityPlatformComment.ISparse =
    await api.functional.communityPlatform.member.posts.comments.create(
      connection,
      {
        postId: post.id,
        body: {
          content: RandomGenerator.paragraph({ sentences: 2 }),
        } satisfies ICommunityPlatformComment.ICreate,
      },
    );
  typia.assert(comment);

  // Step 5: Cast upvotes to establish a positive score
  const upvoteCount = 5;
  for (let i = 0; i < upvoteCount; i++) {
    const voteResponse: ICommunityPlatformCommentVoteResponse =
      await api.functional.communityPlatform.member.comments.votes.create(
        connection,
        {
          commentId: comment.id,
          body: {
            vote_state: "upvote",
          } satisfies ICommunityPlatformCommentVoteRequest,
        },
      );
    typia.assert(voteResponse);
  }

  // Step 6: Cast downvotes to establish a negative counterbalance
  const downvoteCount = 2;
  for (let i = 0; i < downvoteCount; i++) {
    const voteResponse: ICommunityPlatformCommentVoteResponse =
      await api.functional.communityPlatform.member.comments.votes.create(
        connection,
        {
          commentId: comment.id,
          body: {
            vote_state: "downvote",
          } satisfies ICommunityPlatformCommentVoteRequest,
        },
      );
    typia.assert(voteResponse);
  }

  // Step 7: Retrieve the comment score using the analytics endpoint
  const scoreResponse: ICommunityPlatformCommentScore =
    await api.functional.communityPlatform.analytics.comments.score.at(
      connection,
      {
        commentId: comment.id,
      },
    );
  typia.assert(scoreResponse);

  // Step 8: Validate that the score equals upvotes minus downvotes (5 - 2 = 3)
  TestValidator.equals(
    "comment score equals upvotes minus downvotes",
    scoreResponse.score,
    upvoteCount - downvoteCount,
  );
}
