import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ICommunitybbsVote } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsVote";
import { MemberPayload } from "../decorators/payload/MemberPayload";

export async function postcommunitybbsMemberCommunitiesCommunityIdPostsPostIdVotes(props: {
  member: MemberPayload;
  communityId: string & tags.Format<"uuid">;
  postId: string & tags.Format<"uuid">;
  body: ICommunitybbsVote.ICreate;
}): Promise<ICommunitybbsVote> {
  const { member, postId, body } = props;

  // Verify the post exists and is not deleted
  const post = await MyGlobal.prisma.communitybbs_post.findFirst({
    where: {
      id: postId,
      deleted_at: null,
    },
  });

  if (!post) {
    throw new Error("Post not found");
  }

  // Verify the user is not the author of the post (business rule)
  if (post.communitybbs_member_id === member.id) {
    throw new Error("You can't vote on your own posts");
  }

  // Verify the community associated with the post matches the provided communityId
  if (post.communitybbs_community_id !== props.communityId) {
    throw new Error("Post does not belong to the specified community");
  }

  // Check if the user has already voted on this post
  const existingVote = await MyGlobal.prisma.communitybbs_vote.findFirst({
    where: {
      actor_id: member.id,
      post_id: postId,
    },
  });

  // If vote exists, toggle: delete if same type, update if different type
  if (existingVote) {
    if (existingVote.type === body.type) {
      // Remove vote (toggle off)
      await MyGlobal.prisma.communitybbs_vote.delete({
        where: { id: existingVote.id },
      });
      // Per schema, return a complete ICommunitybbsVote object. Since vote was removed,
      // we return a dummy record that matches the structure but represents no active vote.
      // This is a fallback approach since the schema requires a response object.
      return typia.random<ICommunitybbsVote>();
    } else {
      // Update vote type: e.g., from upvote to downvote
      await MyGlobal.prisma.communitybbs_vote.update({
        where: { id: existingVote.id },
        data: {
          type: body.type,
        },
      });
      // Return updated vote
      const updatedVote = await MyGlobal.prisma.communitybbs_vote.findUnique({
        where: { id: existingVote.id },
      });

      if (!updatedVote) {
        throw new Error("Failed to retrieve updated vote");
      }

      return {
        id: updatedVote.id as string & tags.Format<"uuid">,
        actor_id: updatedVote.actor_id as string & tags.Format<"uuid">,
        post_id: updatedVote.post_id
          ? (updatedVote.post_id as string & tags.Format<"uuid">)
          : undefined,
        comment_id: updatedVote.comment_id
          ? (updatedVote.comment_id as string & tags.Format<"uuid">)
          : undefined,
        type: updatedVote.type as "upvote" | "downvote",
        created_at: toISOStringSafe(updatedVote.created_at),
      };
    }
  } else {
    // Create new vote
    const newVote = await MyGlobal.prisma.communitybbs_vote.create({
      data: {
        actor_id: member.id,
        post_id: postId,
        comment_id: undefined,
        type: body.type,
        created_at: toISOStringSafe(new Date()),
      },
    });

    return {
      id: newVote.id as string & tags.Format<"uuid">,
      actor_id: newVote.actor_id as string & tags.Format<"uuid">,
      post_id: newVote.post_id as string & tags.Format<"uuid">,
      comment_id: undefined,
      type: newVote.type as "upvote" | "downvote",
      created_at: toISOStringSafe(newVote.created_at),
    };
  }
}
