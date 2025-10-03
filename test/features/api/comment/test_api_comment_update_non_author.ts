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

export async function test_api_comment_update_non_author(
  connection: api.IConnection,
) {
  // 1. Authenticate first member (comment author)
  const authorEmail: string = typia.random<string & tags.Format<"email">>();
  const author: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: authorEmail,
        password_hash: "hashedpassword123",
      } satisfies IMember.IJoin,
    });
  typia.assert(author);

  // 2. Authenticate second member (non-author attempting update)
  const nonAuthorEmail: string = typia.random<string & tags.Format<"email">>();
  const nonAuthor: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: nonAuthorEmail,
        password_hash: "hashedpassword456",
      } satisfies IMember.IJoin,
    });
  typia.assert(nonAuthor);

  // 3. Switch context to author to create a community
  await api.functional.auth.member.join(connection, {
    body: {
      email: authorEmail,
      password_hash: "hashedpassword123",
    } satisfies IMember.IJoin,
  });

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

  // 4. Create a post within the community
  const post: ICommunityPlatformPost =
    await api.functional.communityPlatform.member.posts.create(connection, {
      body: {
        community_id: community.id,
        title: RandomGenerator.paragraph({
          sentences: 3,
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

  // 5. Create a comment as the author
  const comment: ICommunityPlatformComment.ISparse =
    await api.functional.communityPlatform.member.posts.comments.create(
      connection,
      {
        postId: post.id,
        body: {
          content: RandomGenerator.paragraph({
            sentences: 2,
            wordMin: 3,
            wordMax: 6,
          }),
        } satisfies ICommunityPlatformComment.ICreate,
      },
    );
  typia.assert(comment);

  // 6. Switch context to non-author for unauthorized update attempt
  await api.functional.auth.member.join(connection, {
    body: {
      email: nonAuthorEmail,
      password_hash: "hashedpassword456",
    } satisfies IMember.IJoin,
  });

  // 7. Attempt to update comment as non-author – should return 403 Forbidden
  await TestValidator.error("non-author cannot update comment", async () => {
    await api.functional.communityPlatform.member.posts.comments.update(
      connection,
      {
        postId: post.id,
        commentId: comment.id,
        body: {
          content: "updated content by non-author", // Valid content, wrong author
        } satisfies ICommunityPlatformComment.IUpdate,
      },
    );
  });
}
