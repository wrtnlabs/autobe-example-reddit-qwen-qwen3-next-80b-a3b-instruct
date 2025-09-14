import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ICommunitybbsCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsCommunity";
import { AdministratorPayload } from "../decorators/payload/AdministratorPayload";

export async function deleteadminCommunitiesName(props: {
  administrator: AdministratorPayload;
  name: string;
}): Promise<ICommunitybbsCommunity> {
  const community = await MyGlobal.prisma.communitybbs_community.findUnique({
    where: { name: props.name },
  });

  if (!community) {
    throw new Error("Community not found");
  }

  const now = toISOStringSafe(new Date());

  const updated = await MyGlobal.prisma.communitybbs_community.update({
    where: { name: props.name },
    data: {
      deleted_at: now,
      updated_at: now,
    },
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

  return updated;
}
