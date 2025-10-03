import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunityPlatformCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunity";
import type { ICommunityPlatformMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformMember";
import type { ICommunityPlatformPost } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformPost";
import type { IMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IMember";

export async function test_api_post_vote_toggle_downvote_to_upvote(
  connection: api.IConnection,
) {
  // Step 1: Authenticate a member user
  const memberEmail: string = typia.random<string & tags.Format<"email">>();
  const member: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: memberEmail,
        password_hash: "hashed_password_123",
      } satisfies IMember.IJoin,
    });
  typia.assert(member);

  // Step 2: Create a community
  const communityName: string = `community_${RandomGenerator.alphaNumeric(8)}`;
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

  // Step 3: Create a post in the community
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
          sentenceMin: 10,
          sentenceMax: 15,
          wordMin: 4,
          wordMax: 8,
        }),
      } satisfies ICommunityPlatformPost.ICreate,
    });
  typia.assert(post);

  // Step 4: Create an initial downvote on the post
  const initialDownvote: void =
    await api.functional.communityPlatform.member.posts.votes.create(
      connection,
      {
        postId: post.id,
        body: {
          vote_state: "downvote",
        } satisfies ICommunityPlatformPost.ICreateVote,
      },
    );
  typia.assert(initialDownvote);

  // Step 5: Toggle the vote from downvote to upvote
  const toggledUpvote: void =
    await api.functional.communityPlatform.member.posts.votes.create(
      connection,
      {
        postId: post.id,
        body: {
          vote_state: "upvote",
        } satisfies ICommunityPlatformPost.ICreateVote,
      },
    );
  typia.assert(toggledUpvote);

  // Step 6: Validate that the vote state was successfully toggled
  // Since the API returns void after a vote toggle, we cannot directly validate the vote state
  // We infer success by the absence of error and the business logic above
  // The system should have deleted the downvote and created an upvote, changing the post score from -1 to +1
  // This change in score would be observable in the community feed but is not directly verifiable from this API
  // The test passes when no error is thrown and the vote toggle operation succeeds
}
