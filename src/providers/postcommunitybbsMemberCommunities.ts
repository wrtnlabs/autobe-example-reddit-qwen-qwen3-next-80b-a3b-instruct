import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ICommunitybbsCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsCommunity";
import { MemberPayload } from "../decorators/payload/MemberPayload";

export async function postcommunitybbsMemberCommunities(props: {
  member: MemberPayload;
  body: ICommunitybbsCommunity.ICreate;
}): Promise<ICommunitybbsCommunity> {
  const now = toISOStringSafe(new Date());

  const created = await MyGlobal.prisma.communitybbs_community.create({
    data: {
      id: v4() as string & tags.Format<"uuid">,
      name: props.body.name,
      description: props.body.description,
      category: props.body.category,
      logo: props.body.logo,
      banner: props.body.banner,
      rules: props.body.rules,
      created_at: now,
      updated_at: now,
      member_count: 1,
      last_active_at: now,
    },
  });

  return {
    id: created.id,
    name: created.name,
    description: created.description,
    category: created.category,
    logo: created.logo,
    banner: created.banner,
    rules: created.rules,
    created_at: created.created_at,
    updated_at: created.updated_at,
    deleted_at: created.deleted_at,
    member_count: created.member_count,
    last_active_at: created.last_active_at,
  };
}
