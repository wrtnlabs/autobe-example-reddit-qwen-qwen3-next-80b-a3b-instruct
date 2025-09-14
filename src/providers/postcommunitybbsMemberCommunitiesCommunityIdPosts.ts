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

  // Authorization check: Verify member exists in database
  const memberRecord = await MyGlobal.prisma.communitybbs_member.findFirst({
    where: {
      id: member.id,
    },
  });

  if (!memberRecord) {
    throw new Error("Unauthorized: Member not found");
  }

  // Create post with explicit types and conversion
  const createdPost = await MyGlobal.prisma.communitybbs_post.create({
    data: {
      id: v4() as string & tags.Format<"uuid">,
      communitybbs_community_id: communityId,
      communitybbs_member_id: member.id,
      title: body.title,
      body: body.body,
      display_name: body.display_name,
      created_at: toISOStringSafe(new Date()),
      updated_at: undefined,
      deleted_at: undefined,
    },
  });

  // Return explicitly typed object to guarantee type safety
  return {
    id: createdPost.id,
    communitybbs_community_id: createdPost.communitybbs_community_id,
    communitybbs_member_id: createdPost.communitybbs_member_id,
    title: createdPost.title,
    body: createdPost.body,
    display_name: createdPost.display_name,
    created_at: toISOStringSafe(createdPost.created_at),
    updated_at: createdPost.updated_at
      ? toISOStringSafe(createdPost.updated_at)
      : undefined,
    deleted_at: createdPost.deleted_at
      ? toISOStringSafe(createdPost.deleted_at)
      : undefined,
  };
}
