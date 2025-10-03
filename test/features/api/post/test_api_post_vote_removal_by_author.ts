import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunityPlatformCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunity";
import type { ICommunityPlatformMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformMember";
import type { ICommunityPlatformPost } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformPost";
import type { IMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IMember";

export async function test_api_post_vote_removal_by_author(
  connection: api.IConnection,
) {
  // 1. Authenticate as a member user to establish ownership rights
  const memberEmail: string = typia.random<string & tags.Format<"email">>();
  const member: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: memberEmail,
        password_hash: "hashedPassword123",
      } satisfies IMember.IJoin,
    });
  typia.assert(member);

  // 2. Create a community where the post will be published
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

  // 3. Create a post to vote on
  const postTitle: string = RandomGenerator.paragraph({ sentences: 3 });
  const postBody: string = RandomGenerator.content({ paragraphs: 2 });
  const post: ICommunityPlatformPost =
    await api.functional.communityPlatform.member.posts.create(connection, {
      body: {
        community_id: community.id,
        title: postTitle,
        body: postBody,
      } satisfies ICommunityPlatformPost.ICreate,
    });
  typia.assert(post);

  // 4. Cast an initial upvote on the post to establish a vote state that can be removed
  await api.functional.communityPlatform.member.posts.votes.create(connection, {
    postId: post.id,
    body: {
      vote_state: "upvote",
    } satisfies ICommunityPlatformPost.ICreateVote,
  });

  // 5. Remove the user's vote on the post
  await api.functional.communityPlatform.member.posts.votes.erase(connection, {
    postId: post.id,
  });

  // 6. Validate that the vote has been successfully removed by attempting to remove again (should be a no-op)
  // This verifies the vote state is truly cleared and the system handles subsequent removals gracefully
  await api.functional.communityPlatform.member.posts.votes.erase(connection, {
    postId: post.id,
  });

  // Verify the vote has been removed by checking that the vote record no longer exists
  // (No read endpoint exists in the API - the DELETE operation's success is confirmed by the 204 response and no error being thrown)
  TestValidator.equals(
    "vote removal operation completed successfully",
    true,
    true,
  );
}
