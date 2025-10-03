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

export async function test_api_comment_score_after_upvote(
  connection: api.IConnection,
) {
  // Authenticate as creator to create community
  const creatorEmail = typia.random<string & tags.Format<"email">>();
  const creator = await api.functional.auth.member.join(connection, {
    body: {
      email: creatorEmail,
      password_hash: typia.random<string>(),
    } satisfies IMember.IJoin,
  });
  typia.assert(creator);

  // Create a community
  const community =
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

  // Create a post in the community
  const post = await api.functional.communityPlatform.member.posts.create(
    connection,
    {
      body: {
        community_id: community.id,
        title: RandomGenerator.paragraph({ sentences: 3 }),
        body: RandomGenerator.content({ paragraphs: 1 }),
      } satisfies ICommunityPlatformPost.ICreate,
    },
  );
  typia.assert(post);

  // Create a comment on the post
  const comment =
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

  // Authenticate as a member to upvote
  const memberEmail = typia.random<string & tags.Format<"email">>();
  await api.functional.auth.member.join(connection, {
    body: {
      email: memberEmail,
      password_hash: typia.random<string>(),
    } satisfies IMember.IJoin,
  });

  // Upvote the comment for the first time
  const voteResponse =
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

  // Retrieve the comment's score to verify it's 1
  const scoreResponse =
    await api.functional.communityPlatform.analytics.comments.score.at(
      connection,
      {
        commentId: comment.id,
      },
    );
  typia.assert(scoreResponse);
  TestValidator.equals(
    "comment score should be 1 after first upvote",
    scoreResponse.score,
    1,
  );
}
