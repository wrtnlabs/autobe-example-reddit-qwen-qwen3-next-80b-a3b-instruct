import { HttpException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import typia, { tags } from "typia";
import { v4 } from "uuid";
import { MyGlobal } from "../MyGlobal";
import { PasswordUtil } from "../utils/PasswordUtil";
import { toISOStringSafe } from "../utils/toISOStringSafe";

import { ICommunityPlatformMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformMember";
import { AdminPayload } from "../decorators/payload/AdminPayload";

export async function getCommunityPlatformAdminMembersMemberId(props: {
  admin: AdminPayload;
  memberId: string & tags.Format<"uuid">;
}): Promise<ICommunityPlatformMember> {
  const member =
    await MyGlobal.prisma.community_platform_member.findFirstOrThrow({
      where: {
        id: props.memberId,
        deleted_at: null,
      },
      select: {
        id: true,
        email: true,
        display_name: true,
        created_at: true,
        last_login_at: true,
      },
    });

  return {
    id: member.id,
    email: member.email,
    display_name:
      member.display_name === null ? undefined : member.display_name,
    created_at: toISOStringSafe(member.created_at),
    last_login_at: member.last_login_at
      ? toISOStringSafe(member.last_login_at)
      : undefined,
  };
}
