import { HttpException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import typia, { tags } from "typia";
import { v4 } from "uuid";
import { MyGlobal } from "../MyGlobal";
import { PasswordUtil } from "../utils/PasswordUtil";
import { toISOStringSafe } from "../utils/toISOStringSafe";

import { ICommunityPlatformMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformMember";
import { IPageICommunityPlatformMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageICommunityPlatformMember";
import { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import { AdminPayload } from "../decorators/payload/AdminPayload";

export async function patchCommunityPlatformAdminAdminMembers(props: {
  admin: AdminPayload;
  body: ICommunityPlatformMember.IRequest;
}): Promise<IPageICommunityPlatformMember.ISummary> {
  const {
    search,
    sortBy = "created_at",
    sortOrder = "desc",
    page = 1,
    limit = 20,
  } = props.body;

  // Validate sort options
  if (sortBy !== "created_at" && sortBy !== "email") {
    throw new HttpException("Invalid sortBy value", 400);
  }
  if (sortOrder !== "asc" && sortOrder !== "desc") {
    throw new HttpException("Invalid sortOrder value", 400);
  }

  // Build where condition inline
  const where = {
    deleted_at: null,
    ...(search &&
      search.length >= 2 && {
        OR: [
          { email: { contains: search } },
          { display_name: { contains: search } },
        ],
      }),
  };

  // Build orderBy inline
  const orderBy =
    sortBy === "email" ? { email: sortOrder } : { created_at: sortOrder };

  // Fetch data and count
  const [members, total] = await Promise.all([
    MyGlobal.prisma.community_platform_member.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    MyGlobal.prisma.community_platform_member.count({ where }),
  ]);

  // Map to ISummary format
  const data: ICommunityPlatformMember.ISummary[] = members.map((member) => ({
    id: member.id,
    email: member.email,
    display_name: member.display_name ?? undefined,
    created_at: toISOStringSafe(member.created_at),
    last_login_at: member.last_login_at
      ? toISOStringSafe(member.last_login_at)
      : undefined,
  }));

  // Return paginated result with plain numbers for pagination
  return {
    pagination: {
      current: Number(page),
      limit: Number(limit),
      records: Number(total),
      pages: Math.ceil(total / limit),
    },
    data,
  };
}
