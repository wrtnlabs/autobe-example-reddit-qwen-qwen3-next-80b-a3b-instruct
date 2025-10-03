import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunityPlatformCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunity";
import type { ICommunityPlatformMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformMember";
import type { ICommunityPlatformPost } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformPost";
import type { IMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IMember";

export async function test_api_post_creation_by_member(
  connection: api.IConnection,
) {
  // 1. Authenticate member for post creation
  const memberEmail: string = typia.random<string & tags.Format<"email">>();
  const member: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: memberEmail,
        password_hash: "hashed_password_123", // Required string field
      } satisfies IMember.IJoin,
    });
  typia.assert(member);

  // 2. Create a community for posting
  const communityName: string =
    "test-community-" + RandomGenerator.alphaNumeric(6);
  const community: ICommunityPlatformCommunity =
    await api.functional.communityPlatform.member.communities.create(
      connection,
      {
        body: {
          name: communityName, // Required 5-64 alphanumeric chars
          category: "Tech & Programming", // Required enum value
          description: "A test community for post creation validation", // Optional description
          rules: "1. Be respectful\n2. No spam", // Optional rules
          logo_url: "https://example.com/logo.png", // Optional logo
          banner_url: "https://example.com/banner.jpg", // Optional banner
        } satisfies ICommunityPlatformCommunity.ICreate,
      },
    );
  typia.assert(community);

  // 3. Create a post within the community
  const postTitle: string = RandomGenerator.paragraph({
    sentences: 3,
    wordMin: 3,
    wordMax: 8,
  }); // 5-120 chars
  const postBody: string = RandomGenerator.content({
    paragraphs: 2,
    sentenceMin: 5,
    sentenceMax: 10,
    wordMin: 3,
    wordMax: 10,
  }); // 10-10,000 chars
  const post: ICommunityPlatformPost =
    await api.functional.communityPlatform.member.posts.create(connection, {
      body: {
        community_id: community.id, // Required UUID
        title: postTitle,
        body: postBody,
        author_display_name: "Test Author", // Optional display name
      } satisfies ICommunityPlatformPost.ICreate,
    });
  typia.assert(post);

  // 4. Validate post created successfully
  TestValidator.equals(
    "post belongs to correct community",
    post.community_id,
    community.id,
  );
  TestValidator.equals("post title matches", post.title, postTitle);
  TestValidator.equals("post body matches", post.body, postBody);
  if (post.author_display_name) {
    TestValidator.equals(
      "post author display name matches",
      post.author_display_name,
      "Test Author",
    );
  }

  // 5. Verify unauthenticated user cannot create post (separate connection)
  // Create unauthenticated connection
  const unauthConn: api.IConnection = { ...connection, headers: {} };
  await TestValidator.error(
    "unauthenticated user should fail to create post",
    async () => {
      await api.functional.communityPlatform.member.posts.create(unauthConn, {
        body: {
          community_id: community.id,
          title: "Unauthorized Post",
          body: "This should fail",
        } satisfies ICommunityPlatformPost.ICreate,
      });
    },
  );
}
