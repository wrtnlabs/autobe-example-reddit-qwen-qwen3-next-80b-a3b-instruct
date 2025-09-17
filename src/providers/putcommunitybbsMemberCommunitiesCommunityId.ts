import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ICommunitybbsCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsCommunity";
import { MemberPayload } from "../decorators/payload/MemberPayload";

export async function putcommunitybbsMemberCommunitiesCommunityId(props: {
  member: MemberPayload;
  communityId: string & tags.Format<"uuid">;
  body: ICommunitybbsCommunity.IUpdate;
}): Promise<ICommunitybbsCommunity> {
  const { member, communityId, body } = props;

  // Fetch the community to verify existence and ownership
  const community =
    await MyGlobal.prisma.communitybbs_community.findUniqueOrThrow({
      where: { id: communityId },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        logo: true,
        banner: true,
        rules: true,
        created_at: true,
        updated_at: true,
        deleted_at: true,
        member_count: true,
        last_active_at: true,
        communitybbs_member_id: true,
      },
    });

  // Check ownership: only the creator (member who created community) can update
  if (community.communitybbs_member_id !== member.id) {
    throw new Error(
      "Unauthorized: You can only update communities you created",
    );
  }

  // Check if community is deleted (soft delete)
  if (community.deleted_at !== null) {
    throw new Error("Cannot update a deleted community");
  }

  // Prepare update data
  const updateData: {
    description?: string | null;
    category?: string | null;
    logo?: string | null;
    banner?: string | null;
    rules?: string | null;
    updated_at: string & tags.Format<"date-time">;
    last_active_at: string & tags.Format<"date-time">;
  } = {
    updated_at: toISOStringSafe(new Date()),
    last_active_at: toISOStringSafe(new Date()),
  };

  // Only include fields that are explicitly provided in the request
  if (body.description !== undefined) {
    updateData.description = body.description;
  }

  if (body.category !== undefined) {
    updateData.category = body.category;
  }

  if (body.logo !== undefined) {
    updateData.logo = body.logo;
  }

  if (body.banner !== undefined) {
    updateData.banner = body.banner;
  }

  if (body.rules !== undefined) {
    updateData.rules = body.rules;
  }

  // Update the community
  const updated = await MyGlobal.prisma.communitybbs_community.update({
    where: { id: communityId },
    data: updateData,
  });

  // Return the updated community with all required fields
  return {
    id: updated.id,
    name: updated.name,
    description: updated.description,
    category: updated.category,
    logo: updated.logo,
    banner: updated.banner,
    rules: updated.rules,
    created_at: updated.created_at,
    updated_at: updated.updated_at,
    deleted_at: updated.deleted_at,
    member_count: updated.member_count,
    last_active_at: updated.last_active_at,
  };
}
