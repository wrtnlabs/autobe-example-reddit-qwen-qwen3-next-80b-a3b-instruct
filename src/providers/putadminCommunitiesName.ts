import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ICommunitybbsCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsCommunity";
import { AdministratorPayload } from "../decorators/payload/AdministratorPayload";

export async function putadminCommunitiesName(props: {
  administrator: AdministratorPayload;
  name: string;
  body: ICommunitybbsCommunity.IUpdate;
}): Promise<ICommunitybbsCommunity> {
  // Validate administrator exists and is active
  const admin =
    await MyGlobal.prisma.communitybbs_administrator.findUniqueOrThrow({
      where: { id: props.administrator.id },
    });

  // Find community by name (path parameter)
  const community =
    await MyGlobal.prisma.communitybbs_community.findUniqueOrThrow({
      where: { name: props.name },
    });

  // Ensure community isn't deleted
  if (community.deleted_at !== null) {
    throw new Error("Community is archived and cannot be updated");
  }

  // Prepare update data - only fields allowed in IUpdate
  const updateData = {
    description: body.description ?? undefined,
    category: body.category ?? undefined,
    logo: body.logo ?? undefined,
    banner: body.banner ?? undefined,
    rules: body.rules ?? undefined,
    updated_at: toISOStringSafe(new Date()),
  };

  // Update community with only permitted fields
  const updated = await MyGlobal.prisma.communitybbs_community.update({
    where: { name: props.name },
    data: updateData,
  });

  // Return full community object with updated values
  return {
    id: updated.id,
    name: updated.name,
    description: updated.description,
    category: updated.category,
    logo: updated.logo,
    banner: updated.banner,
    rules: updated.rules,
    created_at: toISOStringSafe(updated.created_at),
    updated_at: toISOStringSafe(updated.updated_at),
    deleted_at: updated.deleted_at
      ? toISOStringSafe(updated.deleted_at)
      : undefined,
    member_count: updated.member_count,
    last_active_at: toISOStringSafe(updated.last_active_at),
  };
}
