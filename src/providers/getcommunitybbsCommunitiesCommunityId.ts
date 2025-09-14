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
      },
    });

  return {
    id: community.id,
    name: community.name,
    description: community.description ?? undefined,
    category: community.category,
    logo: community.logo ?? undefined,
    banner: community.banner ?? undefined,
    rules: community.rules ?? undefined,
    created_at: toISOStringSafe(community.created_at),
    updated_at: toISOStringSafe(community.updated_at),
    deleted_at: community.deleted_at
      ? toISOStringSafe(community.deleted_at)
      : undefined,
    member_count: community.member_count,
    last_active_at: toISOStringSafe(community.last_active_at),
  };
}
