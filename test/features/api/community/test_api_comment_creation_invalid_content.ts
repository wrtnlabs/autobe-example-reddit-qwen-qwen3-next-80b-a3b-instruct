import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunityPlatformComment } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformComment";
import type { ICommunityPlatformCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunity";
import type { ICommunityPlatformMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformMember";
import type { ICommunityPlatformPost } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformPost";
import type { IMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IMember";

export async function test_api_comment_creation_invalid_content(
  connection: api.IConnection,
) {
  // 1. Authenticate member user
  const memberEmail: string = typia.random<string & tags.Format<"email">>();
  const member: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: memberEmail,
        password_hash: "hashedpassword123",
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

  // 3. Create a post in the community
  const post: ICommunityPlatformPost =
    await api.functional.communityPlatform.member.posts.create(connection, {
      body: {
        community_id: community.id,
        title: RandomGenerator.paragraph({ sentences: 3 }),
        body: RandomGenerator.content({ paragraphs: 2 }),
      } satisfies ICommunityPlatformPost.ICreate,
    });
  typia.assert(post);

  // 4. Test comment creation with content too short (less than 2 characters)
  await TestValidator.error(
    "comment content too short (1 character) should fail",
    async () => {
      await api.functional.communityPlatform.member.posts.comments.create(
        connection,
        {
          postId: post.id,
          body: {
            content: "a", // 1 character - invalid (must be at least 2)
          } satisfies ICommunityPlatformComment.ICreate,
        },
      );
    },
  );

  // 5. Test comment creation with content too long (more than 2,000 characters)
  await TestValidator.error(
    "comment content too long (2,001 characters) should fail",
    async () => {
      const longContent = RandomGenerator.alphaNumeric(2001); // 2,001 characters - invalid
      await api.functional.communityPlatform.member.posts.comments.create(
        connection,
        {
          postId: post.id,
          body: {
            content: longContent,
          } satisfies ICommunityPlatformComment.ICreate,
        },
      );
    },
  );

  // 6. Validate that valid content length (2-2,000 characters) is accepted
  const validContent = RandomGenerator.alphaNumeric(100); // Valid length: 100 characters
  const comment: ICommunityPlatformComment.ISparse =
    await api.functional.communityPlatform.member.posts.comments.create(
      connection,
      {
        postId: post.id,
        body: {
          content: validContent,
        } satisfies ICommunityPlatformComment.ICreate,
      },
    );
  typia.assert(comment);
  TestValidator.equals(
    "comment content matches",
    comment.content,
    validContent,
  );
}
