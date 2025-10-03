import { HttpException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import typia, { tags } from "typia";
import { v4 } from "uuid";
import { MyGlobal } from "../MyGlobal";
import { PasswordUtil } from "../utils/PasswordUtil";
import { toISOStringSafe } from "../utils/toISOStringSafe";

import { ICommunityPlatformAdmin } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformAdmin";
import { ICommunityPlatformAdminId } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformAdminId";
import { ICommunityPlatformAdminMemberId } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformAdminMemberId";
import { AdminPayload } from "../decorators/payload/AdminPayload";

export async function getCommunityPlatformAdminAdminMembersMemberId(props: {
  admin: AdminPayload;
  memberId: string & tags.Format<"uuid">;
}): Promise<ICommunityPlatformAdmin> {
  const admin = await MyGlobal.prisma.community_platform_admin.findFirst({
    where: {
      member_id: props.memberId,
      deleted_at: null,
    },
  });

  if (!admin) {
    throw new HttpException("Admin not found", 404);
  }

  return {
    id: admin.id,
    member_id: admin.member_id,
    created_at: toISOStringSafe(admin.created_at),
    deleted_at: admin.deleted_at
      ? toISOStringSafe(admin.deleted_at)
      : undefined,
  };
}
