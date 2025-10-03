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

export async function test_api_comment_score_after_vote_removal(
  connection: api.IConnection,
) {
  // Step 1: Authenticate as creator to create post
  const creatorEmail: string = typia.random<string & tags.Format<"email">>();
  const creator: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: creatorEmail,
        password_hash: "hashed_password_123",
      } satisfies IMember.IJoin,
    });
  typia.assert(creator);

  // Step 2: Create community for post
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

  // Step 3: Create post to add comment to
  const post: ICommunityPlatformPost =
    await api.functional.communityPlatform.member.posts.create(connection, {
      body: {
        community_id: community.id,
        title: RandomGenerator.paragraph({ sentences: 3 }),
        body: RandomGenerator.content({ paragraphs: 2 }),
      } satisfies ICommunityPlatformPost.ICreate,
    });
  typia.assert(post);

  // Step 4: Create comment to test vote removal
  const comment: ICommunityPlatformComment.ISparse =
    await api.functional.communityPlatform.member.posts.comments.create(
      connection,
      {
        postId: post.id,
        body: {
          content: RandomGenerator.paragraph(),
        } satisfies ICommunityPlatformComment.ICreate,
      },
    );
  typia.assert(comment);

  // Step 5: Authenticate as member to vote
  const voterEmail: string = typia.random<string & tags.Format<"email">>();
  const voter: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: voterEmail,
        password_hash: "hashed_password_456",
      } satisfies IMember.IJoin,
    });
  typia.assert(voter);

  // Step 6: Member upvotes the comment
  const upvoteResponse: ICommunityPlatformCommentVoteResponse =
    await api.functional.communityPlatform.member.comments.votes.create(
      connection,
      {
        commentId: comment.id,
        body: {
          vote_state: "upvote",
        } satisfies ICommunityPlatformCommentVoteRequest,
      },
    );
  typia.assert(upvoteResponse);
  TestValidator.equals(
    "comment score after upvote should be 1",
    upvoteResponse.score,
    1,
  );

  // Step 7: Member removes their vote entirely
  const removeVoteResponse: ICommunityPlatformCommentVoteResponse =
    await api.functional.communityPlatform.member.comments.votes.erase(
      connection,
      {
        commentId: comment.id,
      },
    );
  typia.assert(removeVoteResponse);

  // Step 8: Validate the score returns to 0
  const finalScore: ICommunityPlatformCommentScore =
    await api.functional.communityPlatform.analytics.comments.score.at(
      connection,
      {
        commentId: comment.id,
      },
    );
  typia.assert(finalScore);
  TestValidator.equals(
    "comment score after vote removal should be 0",
    finalScore.score,
    0,
  );
}
