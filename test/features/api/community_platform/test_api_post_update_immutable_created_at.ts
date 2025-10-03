import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunityPlatformCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunity";
import type { ICommunityPlatformMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformMember";
import type { ICommunityPlatformPost } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformPost";
import type { IMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IMember";

export async function test_api_post_update_immutable_created_at(
  connection: api.IConnection,
) {
  // Step 1: Authenticate member
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

  // Step 3: Create a post
  const post: ICommunityPlatformPost =
    await api.functional.communityPlatform.member.posts.create(connection, {
      body: {
        community_id: community.id,
        title: RandomGenerator.paragraph({
          sentences: 3,
          wordMin: 5,
          wordMax: 10,
        }),
        body: RandomGenerator.content({
          paragraphs: 3,
          sentenceMin: 10,
          sentenceMax: 20,
          wordMin: 4,
          wordMax: 8,
        }),
      } satisfies ICommunityPlatformPost.ICreate,
    });
  typia.assert(post);

  // Step 4: Update post with valid properties (title and body)
  // The system should automatically preserve the created_at timestamp
  // The created_at property cannot be included in IUpdate type as it's immutable
  const updatedPost: ICommunityPlatformPost =
    await api.functional.communityPlatform.member.posts.update(connection, {
      postId: post.id,
      body: {
        title: "Updated Title",
        body: "Updated body content with new information",
      } satisfies ICommunityPlatformPost.IUpdate,
    });
  typia.assert(updatedPost);

  // Step 5: Verify that created_at remains unchanged from original post
  // This validates that the created_at timestamp is immutable
  TestValidator.equals(
    "created_at should remain unchanged after update",
    post.created_at,
    updatedPost.created_at,
  );

  // Step 6: Verify that title and body were successfully updated
  TestValidator.equals(
    "title should be updated to new value",
    "Updated Title",
    updatedPost.title,
  );

  TestValidator.equals(
    "body should be updated to new value",
    "Updated body content with new information",
    updatedPost.body,
  );
}
