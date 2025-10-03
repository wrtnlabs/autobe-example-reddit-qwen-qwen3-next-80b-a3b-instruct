import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunityPlatformComment } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformComment";
import type { ICommunityPlatformCommentVoteRequest } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommentVoteRequest";
import type { ICommunityPlatformCommentVoteResponse } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommentVoteResponse";
import type { ICommunityPlatformCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunity";
import type { ICommunityPlatformMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformMember";
import type { ICommunityPlatformPost } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformPost";
import type { IMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IMember";

export async function test_api_comment_vote_create_downvote(
  connection: api.IConnection,
) {
  // 1. Authenticate as a member user
  const memberEmail: string = typia.random<string & tags.Format<"email">>();
  const member: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: memberEmail,
        password_hash: "hashed_password_123", // Required property exists in IMember.IJoin
      } satisfies IMember.IJoin,
    });
  typia.assert(member);

  // 2. Create a community for hosting the post and comment
  const communityName: string = RandomGenerator.alphaNumeric(10);
  const community: ICommunityPlatformCommunity =
    await api.functional.communityPlatform.member.communities.create(
      connection,
      {
        body: {
          name: communityName,
          category: "Tech & Programming", // Required property, exact enum value
        } satisfies ICommunityPlatformCommunity.ICreate,
      },
    );
  typia.assert(community);

  // 3. Create a post within the community
  const postTitle: string = RandomGenerator.paragraph({ sentences: 2 });
  const postBody: string = RandomGenerator.content({ paragraphs: 2 });
  const post: ICommunityPlatformPost =
    await api.functional.communityPlatform.member.posts.create(connection, {
      body: {
        community_id: community.id, // Required property from ICommunityPlatformPost.ICreate
        title: postTitle,
        body: postBody,
      } satisfies ICommunityPlatformPost.ICreate,
    });
  typia.assert(post);

  // 4. Create a comment on the post
  const commentContent: string = RandomGenerator.paragraph({ sentences: 1 });
  const comment: ICommunityPlatformComment.ISparse =
    await api.functional.communityPlatform.member.posts.comments.create(
      connection,
      {
        postId: post.id,
        body: {
          content: commentContent, // Required property from ICommunityPlatformComment.ICreate, 2-2000 chars
        } satisfies ICommunityPlatformComment.ICreate,
      },
    );
  typia.assert(comment);

  // 5. Create a downvote on the comment
  const voteResponse: ICommunityPlatformCommentVoteResponse =
    await api.functional.communityPlatform.member.comments.votes.create(
      connection,
      {
        commentId: comment.id, // Required property from ICommunityPlatformMember.comments.votes.create props
        body: {
          vote_state: "downvote", // Required property, exact enum value from ICommunityPlatformCommentVoteRequest
        } satisfies ICommunityPlatformCommentVoteRequest,
      },
    );
  typia.assert(voteResponse);

  // 6. Validate that the vote was registered successfully
  // The response contains the updated score after downvoting
  // We verify that the score was decremented from its original value before voting
  // Note: Original score before voting should be 0 (no votes), so after downvote it should be -1
  TestValidator.equals(
    "comment score after downvote should be -1",
    voteResponse.score,
    -1,
  );
}
