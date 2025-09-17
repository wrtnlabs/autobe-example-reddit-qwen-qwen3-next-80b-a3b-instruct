import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ICommunitybbsVote } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsVote";
import { MemberPayload } from "../decorators/payload/MemberPayload";

/**
 * Cast a vote on a post
 *
 * This operation enables authenticated members to upvote or downvote a post,
 * contributing to the post's overall score which is displayed in UIs. The vote
 * is stored in the communitybbs_vote table, which links each vote to an actor
 * (authenticated user), a post (via post_id), and a type ('upvote' or
 * 'downvote').
 *
 * The system enforces several constraints: a user cannot vote on their own
 * post, as specified in the business rule: "You can't vote on your own
 * posts/comments." This is validated by comparing the authenticated user's ID
 * with the communitybbs_member_id of the post. If the user is the post author,
 * the operation will be denied with a 403 error.
 *
 * The user's vote state is toggleable: if the user has previously upvoted the
 * post and clicks again, the vote is removed (reverted to 'none'). If the user
 * has previously downvoted and clicks again, the vote is also removed. If the
 * user switches from upvote to downvote or vice versa, the change is processed
 * as an update.
 *
 * The vote does not have a comment or additional context field; it is purely
 * binary. The post score (upvotes - downvotes) is calculated dynamically at
 * query time from this table, and no aggregated field exists in the post table
 * itself, maintaining data normalization.
 *
 * This operation does not require the communityId for the voting logic itself,
 * but it is included in the path for context and consistency with the resource
 * hierarchy, enabling proper authorization and validation checks against
 * community ownership. The request body must contain the vote type as 'upvote'
 * or 'downvote'.
 *
 * @param props - Request properties
 * @param props.member - The authenticated member making the request
 * @param props.communityId - UUID of the community containing the post
 * @param props.postId - UUID of the post to be voted on
 * @param props.body - The vote type to cast ('upvote' or 'downvote')
 * @returns The updated vote state
 * @throws {Error} When user attempts to vote on their own post
 * @throws {Error} When post does not exist
 */
export async function postcommunitybbsMemberCommunitiesCommunityIdPostsPostIdVotes(props: {
  member: MemberPayload;
  communityId: string & tags.Format<"uuid">;
  postId: string & tags.Format<"uuid">;
  body: ICommunitybbsVote.ICreate;
}): Promise<ICommunitybbsVote> {
  const { member, postId, body } = props;

  // Fetch the post to verify existence and check ownership
  const post = await MyGlobal.prisma.communitybbs_post.findUniqueOrThrow({
    where: { id: postId },
  });

  // Prevent voting on own posts (business rule)
  if (post.communitybbs_member_id === member.id) {
    throw new Error("You cannot vote on your own posts");
  }

  // Check for existing vote by this member on this post
  const existingVote = await MyGlobal.prisma.communitybbs_vote.findUnique({
    where: {
      actor_id_post_id: {
        actor_id: member.id,
        post_id: postId,
      },
    },
  });

  // Toggle logic: if existing vote exists and type matches, delete it
  if (existingVote && existingVote.type === body.type) {
    await MyGlobal.prisma.communitybbs_vote.delete({
      where: { id: existingVote.id },
    });

    // Create log entry for vote deletion
    await MyGlobal.prisma.communitybbs_log.create({
      data: {
        actor_id: member.id,
        target_id: postId,
        action_type: "post_vote_removed",
        details: JSON.stringify({ vote_type: body.type }),
        created_at: toISOStringSafe(new Date()),
        ip_address: "",
      },
    });

    // Return empty object since vote was removed
    return {
      id: existingVote.id,
      actor_id: member.id,
      post_id: postId,
      comment_id: undefined,
      type: body.type,
      created_at: existingVote.created_at,
    };
  }

  // If existing vote exists and type differs, update it
  if (existingVote) {
    const updatedVote = await MyGlobal.prisma.communitybbs_vote.update({
      where: { id: existingVote.id },
      data: {
        type: body.type,
      },
    });

    // Create log entry for vote update
    await MyGlobal.prisma.communitybbs_log.create({
      data: {
        actor_id: member.id,
        target_id: postId,
        action_type: "post_vote_updated",
        details: JSON.stringify({
          old_vote_type: existingVote.type,
          new_vote_type: body.type,
        }),
        created_at: toISOStringSafe(new Date()),
        ip_address: "",
      },
    });

    return {
      id: updatedVote.id,
      actor_id: member.id,
      post_id: postId,
      comment_id: undefined,
      type: updatedVote.type,
      created_at: updatedVote.created_at,
    };
  }

  // No existing vote, create new one
  const newVote = await MyGlobal.prisma.communitybbs_vote.create({
    data: {
      id: v4() as string & tags.Format<"uuid">,
      actor_id: member.id,
      post_id: postId,
      comment_id: undefined,
      type: body.type,
      created_at: toISOStringSafe(new Date()),
    },
  });

  // Create log entry for vote creation
  await MyGlobal.prisma.communitybbs_log.create({
    data: {
      actor_id: member.id,
      target_id: postId,
      action_type: "post_vote_created",
      details: JSON.stringify({ vote_type: body.type }),
      created_at: toISOStringSafe(new Date()),
      ip_address: "",
    },
  });

  return {
    id: newVote.id,
    actor_id: newVote.actor_id,
    post_id: newVote.post_id,
    comment_id: newVote.comment_id,
    type: newVote.type,
    created_at: newVote.created_at,
  };
}
