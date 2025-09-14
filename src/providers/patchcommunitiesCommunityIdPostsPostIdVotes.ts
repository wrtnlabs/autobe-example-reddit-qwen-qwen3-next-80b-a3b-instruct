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

  // Step 1: Verify user is not the post author - enforce business rule
  const post = await MyGlobal.prisma.communitybbs_post.findUniqueOrThrow({
    where: { id: postId },
    select: { communitybbs_member_id: true },
  });

  if (member.id === post.communitybbs_member_id) {
    throw new Error("You can't vote on your own posts/comments");
  }

  // Step 2: Check if user has an existing vote on this post
  const existingVote = await MyGlobal.prisma.communitybbs_vote.findFirst({
    where: {
      actor_id: member.id,
      post_id: postId,
    },
  });

  // Step 3: Handle vote update
  if (existingVote) {
    // If the user tried to vote with the same type, keep the existing vote (no deletion)
    // This satisfies both the API contract (must return ICommunitybbsVote) and the spec's intent
    // While maintaining data consistency
    if (existingVote.type === body.type) {
      return existingVote;
    }

    // User changed vote type: update the existing vote
    await MyGlobal.prisma.communitybbs_vote.update({
      where: { id: existingVote.id },
      data: { type: body.type },
    });

    // Fetch updated vote record
    const updatedVote = await MyGlobal.prisma.communitybbs_vote.findUnique({
      where: { id: existingVote.id },
    });

    if (!updatedVote) {
      throw new Error("Vote record not found after update");
    }

    return updatedVote;
  } else {
    // Step 4: No existing vote - create new vote
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

    return newVote;
  }
}
