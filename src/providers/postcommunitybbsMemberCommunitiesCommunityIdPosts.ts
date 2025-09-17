import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ICommunitybbsPost } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsPost";
import { MemberPayload } from "../decorators/payload/MemberPayload";

export async function postcommunitybbsMemberCommunitiesCommunityIdPosts(props: {
  member: MemberPayload;
  communityId: string & tags.Format<"uuid">;
  body: ICommunitybbsPost.ICreate;
}): Promise<ICommunitybbsPost> {
  const { member, communityId, body } = props;

  // Verify community exists and is not deleted
  const community =
    await MyGlobal.prisma.communitybbs_community.findUniqueOrThrow({
      where: {
        id: communityId,
        deleted_at: null,
      },
    });

  // Create the post
  const now = toISOStringSafe(new Date());
  const createdPost = await MyGlobal.prisma.communitybbs_post.create({
    data: {
      id: v4() as string & tags.Format<"uuid">,
      communitybbs_community_id: communityId,
      communitybbs_member_id: member.id,
      title: body.title,
      body: body.body,
      display_name: body.display_name ?? undefined,
      created_at: now,
      updated_at: undefined,
      deleted_at: undefined,
    },
  });

  // Update community's last_active_at and increment member_count
  await MyGlobal.prisma.communitybbs_community.update({
    where: {
      id: communityId,
    },
    data: {
      last_active_at: now,
      member_count: community.member_count + 1,
    },
  });

  // Return the created post
  return {
    id: createdPost.id,
    communitybbs_community_id: createdPost.communitybbs_community_id,
    communitybbs_member_id: createdPost.communitybbs_member_id,
    title: createdPost.title,
    body: createdPost.body,
    display_name: createdPost.display_name,
    created_at: createdPost.created_at,
    updated_at: createdPost.updated_at,
    deleted_at: createdPost.deleted_at,
  };
}
