import { HttpException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import typia, { tags } from "typia";
import { v4 } from "uuid";
import { MyGlobal } from "../MyGlobal";
import { PasswordUtil } from "../utils/PasswordUtil";
import { toISOStringSafe } from "../utils/toISOStringSafe";

import { ICommunityPlatformMemberIRequest } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformMemberIRequest";
import { IPageICommunityPlatformMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageICommunityPlatformMember";
import { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import { ICommunityPlatformMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformMember";
import { AdminPayload } from "../decorators/payload/AdminPayload";

export async function patchCommunityPlatformAdminMembers(props: {
  admin: AdminPayload;
  body: ICommunityPlatformMemberIRequest;
}): Promise<IPageICommunityPlatformMember> {
  const { body } = props;

  // Extract search criteria
  const {
    search,
    createdBefore,
    createdAfter,
    lastLoginBefore,
    lastLoginAfter,
    isActive,
    sortBy = "created_at",
    sortOrder = "desc",
    page = 1,
    limit = 20,
  } = body;

  // Build where conditions
  const where: any = {};

  // Search term (email or display_name) - apply case-insensitive partial match
  if (search && search.length >= 2) {
    where.OR = [
      { email: { contains: search } },
      { display_name: { contains: search } },
    ];
  }

  // Created date filters
  if (createdBefore) {
    where.created_at = { ...where.created_at, lte: createdBefore };
  }
  if (createdAfter) {
    where.created_at = { ...where.created_at, gte: createdAfter };
  }

  // Last login filters
  if (lastLoginBefore) {
    where.last_login_at = { ...where.last_login_at, lte: lastLoginBefore };
  }
  if (lastLoginAfter) {
    where.last_login_at = { ...where.last_login_at, gte: lastLoginAfter };
  }

  // Active status
  if (isActive !== undefined) {
    if (isActive) {
      where.deleted_at = null;
    } else {
      where.deleted_at = { not: null };
    }
  }

  // Sort configuration
  let orderBy;
  if (sortBy === "email") {
    orderBy = { email: sortOrder };
  } else if (sortBy === "last_login_at") {
    orderBy = { last_login_at: sortOrder };
  } else {
    orderBy = { created_at: sortOrder };
  }

  // Pagination
  const skip = (page - 1) * limit;
  const take = limit;

  // Execute count query
  const count = await MyGlobal.prisma.community_platform_member.count({
    where,
  });

  // Execute findMany query
  const members = await MyGlobal.prisma.community_platform_member.findMany({
    where,
    orderBy,
    skip,
    take,
    select: {
      id: true,
      email: true,
      display_name: true,
      created_at: true,
      last_login_at: true,
    },
  });

  // Transform to response type
  const response: ICommunityPlatformMember[] = members.map((member) => ({
    id: member.id,
    email: member.email,
    display_name: member.display_name ?? undefined,
    created_at: toISOStringSafe(member.created_at),
    last_login_at: member.last_login_at
      ? toISOStringSafe(member.last_login_at)
      : undefined,
  }));

  // Construct pagination info
  const pagination: IPage.IPagination = {
    current: page,
    limit: limit,
    records: count,
    pages: Math.ceil(count / limit),
  };

  return {
    pagination,
    data: response,
  };
}
