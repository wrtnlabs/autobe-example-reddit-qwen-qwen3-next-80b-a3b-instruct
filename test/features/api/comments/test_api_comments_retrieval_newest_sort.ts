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
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageICommunityPlatformComment } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageICommunityPlatformComment";

export async function test_api_comments_retrieval_newest_sort(
  connection: api.IConnection,
) {
  // Step 1: Authenticate member to create community and post
  const memberEmail: string = typia.random<string & tags.Format<"email">>();
  const member: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: memberEmail,
        password_hash:
          "$2b$12$T0097vkA.fly88Y/jF.qt.U9ObQsn9Wr2/wORbUeR58.L/wl11eGm", // Realistic bcrypt hash structure
      } satisfies IMember.IJoin,
    });
  typia.assert(member);

  // Step 2: Create a community to host the post
  const community: ICommunityPlatformCommunity =
    await api.functional.communityPlatform.member.communities.create(
      connection,
      {
        body: {
          name: `test-community-${RandomGenerator.alphaNumeric(8)}`,
          category: "Study & Education",
        } satisfies ICommunityPlatformCommunity.ICreate,
      },
    );
  typia.assert(community);

  // Step 3: Create a post within the community for commenting
  const post: ICommunityPlatformPost =
    await api.functional.communityPlatform.member.posts.create(connection, {
      body: {
        community_id: community.id,
        title: RandomGenerator.paragraph({ sentences: 3 }),
        body: RandomGenerator.content({ paragraphs: 2 }),
      } satisfies ICommunityPlatformPost.ICreate,
    });
  typia.assert(post);

  // Step 4: Create three comments without delays to rely on server timestamps
  const oldestComment: ICommunityPlatformComment.ISparse =
    await api.functional.communityPlatform.member.posts.comments.create(
      connection,
      {
        postId: post.id,
        body: {
          content: "This is the oldest comment.",
        } satisfies ICommunityPlatformComment.ICreate,
      },
    );
  typia.assert(oldestComment);

  const middleComment: ICommunityPlatformComment.ISparse =
    await api.functional.communityPlatform.member.posts.comments.create(
      connection,
      {
        postId: post.id,
        body: {
          content: "This is the middle comment.",
        } satisfies ICommunityPlatformComment.ICreate,
      },
    );
  typia.assert(middleComment);

  const newestComment: ICommunityPlatformComment.ISparse =
    await api.functional.communityPlatform.member.posts.comments.create(
      connection,
      {
        postId: post.id,
        body: {
          content: "This is the newest comment.",
        } satisfies ICommunityPlatformComment.ICreate,
      },
    );
  typia.assert(newestComment);

  // Step 5: Retrieve comments with default sort (newest)
  const commentsPage: IPageICommunityPlatformComment.ISparse =
    await api.functional.communityPlatform.posts.comments.index(connection, {
      postId: post.id,
      body: {}, // No sort parameter specified - defaults to "newest"
    });
  typia.assert(commentsPage);

  // Step 6: Verify pagination metadata
  TestValidator.equals(
    "page pagination matches expected",
    commentsPage.pagination,
    {
      current: 1,
      limit: 20, // Default limit as defined in schema
      records: 3, // Three comments created
      pages: 1, // All fit in one page
    },
  );

  // Step 7: Verify comments are in correct order (newest first)
  TestValidator.equals(
    "first comment is newest",
    commentsPage.data[0].id,
    newestComment.id,
  );
  TestValidator.equals(
    "second comment is middle",
    commentsPage.data[1].id,
    middleComment.id,
  );
  TestValidator.equals(
    "third comment is oldest",
    commentsPage.data[2].id,
    oldestComment.id,
  );

  // Step 8: Verify comment content matches created comments
  TestValidator.equals(
    "newest comment content",
    commentsPage.data[0].content,
    "This is the newest comment.",
  );
  TestValidator.equals(
    "middle comment content",
    commentsPage.data[1].content,
    "This is the middle comment.",
  );
  TestValidator.equals(
    "oldest comment content",
    commentsPage.data[2].content,
    "This is the oldest comment.",
  );
}
