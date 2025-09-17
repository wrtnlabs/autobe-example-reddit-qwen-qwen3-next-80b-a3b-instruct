import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ICommunitybbsVote } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsVote";
import { MemberPayload } from "../decorators/payload/MemberPayload";

export async function patchcommunitiesCommunityIdPostsPostIdVotes(props: {
  member: MemberPayload;
  communityId: string & tags.Format<"uuid">;
  postId: string & tags.Format<"uuid">;
  body: ICommunitybbsVote.IUpdate;
}): Promise<ICommunitybbsVote> {
  const { member, postId, body } = props;

  // Verify the post exists and is not deleted
  const post = await MyGlobal.prisma.communitybbs_post.findUniqueOrThrow({
    where: { id: postId },
  });

  // 🚫 Business Rule: Cannot vote on your own post
  if (post.communitybbs_member_id === member.id) {
    throw new Error("Unauthorized: You cannot vote on your own posts");
  }

  // Check if a vote already exists for this member on this post
  const existingVote = await MyGlobal.prisma.communitybbs_vote.findUnique({
    where: {
      actor_id_post_id: {
        actor_id: member.id,
        post_id: postId,
      },
    },
  });

  // If the new vote type matches the existing vote, delete the vote (toggle off)
  if (existingVote && existingVote.type === body.type) {
    await MyGlobal.prisma.communitybbs_vote.delete({
      where: { id: existingVote.id },
    });

    // Return a vote object with null post_id and comment_id to represent no vote
    // This matches the ICommunitybbsVote schema which has optional post_id
    return {
      id: v4() as string & tags.Format<"uuid">,
      actor_id: member.id,
      post_id: undefined,
      comment_id: undefined,
      type: body.type,
      created_at: toISOStringSafe(new Date()),
    };
  }

  // If vote exists and type is different, update it
  if (existingVote) {
    const updatedVote = await MyGlobal.prisma.communitybbs_vote.update({
      where: { id: existingVote.id },
      data: { type: body.type },
    });

    return {
      id: updatedVote.id as string & tags.Format<"uuid">,
      actor_id: updatedVote.actor_id as string & tags.Format<"uuid">,
      post_id: updatedVote.post_id as
        | (string & tags.Format<"uuid">)
        | undefined,
      comment_id: updatedVote.comment_id as
        | (string & tags.Format<"uuid">)
        | undefined,
      type: updatedVote.type as "upvote" | "downvote",
      created_at: toISOStringSafe(updatedVote.created_at),
    };
  }

  // No existing vote - create a new one
  const newVote = await MyGlobal.prisma.communitybbs_vote.create({
    data: {
      actor_id: member.id,
      post_id: postId,
      type: body.type,
      created_at: toISOStringSafe(new Date()),
    },
  });

  return {
    id: newVote.id as string & tags.Format<"uuid">,
    actor_id: newVote.actor_id as string & tags.Format<"uuid">,
    post_id: newVote.post_id as (string & tags.Format<"uuid">) | undefined,
    comment_id: newVote.comment_id as
      | (string & tags.Format<"uuid">)
      | undefined,
    type: newVote.type as "upvote" | "downvote",
    created_at: toISOStringSafe(newVote.created_at),
  };
}
