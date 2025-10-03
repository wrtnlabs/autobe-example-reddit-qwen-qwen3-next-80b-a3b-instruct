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

export async function test_api_comment_score_retrieval(
  connection: api.IConnection,
) {
  // Step 1: Authenticate a member user to create a post
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

  // Step 3: Create a post to comment on
  const post: ICommunityPlatformPost =
    await api.functional.communityPlatform.member.posts.create(connection, {
      body: {
        community_id: community.id,
        title: RandomGenerator.paragraph({
          sentences: 5,
          wordMin: 4,
          wordMax: 8,
        }),
        body: RandomGenerator.content({
          paragraphs: 2,
          sentenceMin: 8,
          sentenceMax: 15,
          wordMin: 3,
          wordMax: 7,
        }),
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
          content: RandomGenerator.paragraph({
            sentences: 4,
            wordMin: 4,
            wordMax: 8,
          }),
        } satisfies ICommunityPlatformComment.ICreate,
      },
    );
  typia.assert(comment);

  // Step 5: Authenticate two additional member users to vote on the comment
  const voter1Email: string = typia.random<string & tags.Format<"email">>();
  const voter1: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: voter1Email,
        password_hash: "hashed_password_456",
      } satisfies IMember.IJoin,
    });
  typia.assert(voter1);

  const voter2Email: string = typia.random<string & tags.Format<"email">>();
  const voter2: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: voter2Email,
        password_hash: "hashed_password_789",
      } satisfies IMember.IJoin,
    });
  typia.assert(voter2);

  // Step 6: Cast upvotes and downvotes on the comment
  // Cast an upvote from voter1
  const upvoteResponse1: ICommunityPlatformCommentVoteResponse =
    await api.functional.communityPlatform.member.comments.votes.create(
      connection,
      {
        commentId: comment.id,
        body: {
          vote_state: "upvote",
        } satisfies ICommunityPlatformCommentVoteRequest,
      },
    );
  typia.assert(upvoteResponse1);

  // Cast a downvote from voter2
  const downvoteResponse: ICommunityPlatformCommentVoteResponse =
    await api.functional.communityPlatform.member.comments.votes.create(
      connection,
      {
        commentId: comment.id,
        body: {
          vote_state: "downvote",
        } satisfies ICommunityPlatformCommentVoteRequest,
      },
    );
  typia.assert(downvoteResponse);

  // Cast another upvote from voter1 (toggle attempt - should remove vote)
  const upvoteResponse2: ICommunityPlatformCommentVoteResponse =
    await api.functional.communityPlatform.member.comments.votes.create(
      connection,
      {
        commentId: comment.id,
        body: {
          vote_state: "upvote",
        } satisfies ICommunityPlatformCommentVoteRequest,
      },
    );
  typia.assert(upvoteResponse2);

  // Step 7: Retrieve the comment score
  const retrievedScore: ICommunityPlatformCommentScore =
    await api.functional.communityPlatform.analytics.comments.score.at(
      connection,
      {
        commentId: comment.id,
      },
    );
  typia.assert(retrievedScore);

  // Step 8: Validate the score
  // We expect: 1 upvote from voter1 (added, then removed), 1 downvote from voter2, so final score = -1
  // This validates that the score is accurately calculated as (upvotes - downvotes)
  TestValidator.equals(
    "comment score matches upvotes minus downvotes",
    retrievedScore.score,
    -1,
  );
}
