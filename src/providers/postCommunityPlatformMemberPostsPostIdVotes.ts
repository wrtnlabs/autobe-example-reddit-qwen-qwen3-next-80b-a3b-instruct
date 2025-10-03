import { HttpException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import typia, { tags } from "typia";
import { v4 } from "uuid";
import { MyGlobal } from "../MyGlobal";
import { PasswordUtil } from "../utils/PasswordUtil";
import { toISOStringSafe } from "../utils/toISOStringSafe";

import { ICommunityPlatformPost } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformPost";
import { MemberPayload } from "../decorators/payload/MemberPayload";

export async function postCommunityPlatformMemberPostsPostIdVotes(props: {
  member: MemberPayload;
  postId: string & tags.Format<"uuid">;
  body: ICommunityPlatformPost.ICreateVote;
}): Promise<void> {
  const { member, postId, body } = props;
  const { vote_state } = body;

  // Verify post exists and get author_id
  const post = await MyGlobal.prisma.community_platform_posts.findUniqueOrThrow(
    {
      where: { id: postId },
      select: { author_id: true },
    },
  );

  // Authorization: user cannot vote on their own post
  if (post.author_id === member.id) {
    throw new HttpException("You can't vote on your own posts/comments.", 403);
  }

  // Find existing vote using compound unique key
  const existingVote =
    await MyGlobal.prisma.community_platform_post_votes.findUnique({
      where: {
        community_platform_post_id_community_platform_user_id: {
          community_platform_post_id: postId,
          community_platform_user_id: member.id,
        },
      },
    });

  const now = toISOStringSafe(new Date());

  // Handle vote state transitions
  if (existingVote) {
    // Toggle: if current vote equals desired vote, delete (toggle to none)
    if (existingVote.vote_state === vote_state) {
      await MyGlobal.prisma.community_platform_post_votes.delete({
        where: {
          id: existingVote.id,
        },
      });
    } else {
      // Change from upvote to downvote or vice versa
      await MyGlobal.prisma.community_platform_post_votes.update({
        where: {
          id: existingVote.id,
        },
        data: {
          vote_state,
          updated_at: now,
        },
      });
    }
  } else {
    // Create new vote using proper field names
    await MyGlobal.prisma.community_platform_post_votes.create({
      data: {
        id: v4(),
        community_platform_post_id: postId,
        community_platform_user_id: member.id,
        created_at: now,
        updated_at: now,
        vote_state,
      },
    });
  }
}
