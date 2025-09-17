import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ICommunitybbsCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsCommunity";

export async function getcommunitybbsCommunitiesCommunityId(props: {
  communityId: string & tags.Format<"uuid">;
}): Promise<ICommunitybbsCommunity> {
  const community =
    await MyGlobal.prisma.communitybbs_community.findUniqueOrThrow({
      where: { id: props.communityId },
    });

  // Check if community is deleted
  if (community.deleted_at !== null) {
    throw new Error("Community not found");
  }

  return {
    id: community.id,
    name: community.name,
    description: community.description,
    category: community.category,
    logo: community.logo,
    banner: community.banner,
    rules: community.rules,
    created_at: toISOStringSafe(community.created_at),
    updated_at: toISOStringSafe(community.updated_at),
    deleted_at: community.deleted_at
      ? toISOStringSafe(community.deleted_at)
      : undefined,
    member_count: community.member_count,
    last_active_at: toISOStringSafe(community.last_active_at),
  };
}
