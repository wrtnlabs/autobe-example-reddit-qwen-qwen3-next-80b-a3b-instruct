import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IPageICommunitybbsCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageICommunitybbsCommunity";
import { AdministratorPayload } from "../decorators/payload/AdministratorPayload";

export async function getadminCommunities(props: {
  administrator: AdministratorPayload;
  search: string;
  sortBy: string;
  sortOrder: string;
  page: integer;
  limit: integer;
}): Promise<IPageICommunitybbsCommunity> {
  // Validate inputs with defaults
  const search = props.search?.trim() || "";
  const sortBy: "name" | "created_at" | "member_count" | "last_active_at" = [
    "name",
    "created_at",
    "member_count",
    "last_active_at",
  ].includes(props.sortBy)
    ? (props.sortBy as any)
    : "name";
  const sortOrder: "asc" | "desc" = ["asc", "desc"].includes(props.sortOrder)
    ? (props.sortOrder as any)
    : "asc";
  const page = Math.max(1, props.page || 1);
  const limit = Math.min(100, Math.max(1, props.limit || 20));

  // Build where clause for full-text search
  const where: Record<string, any> = {};
  if (search.length >= 2) {
    where.OR = [
      { name: { contains: search } },
      { description: { contains: search } },
    ];
  }

  // Build orderBy clause with dynamic field
  const orderBy: Record<string, any> = {};
  orderBy[sortBy] = sortOrder;

  // Query with pagination
  const [communities, total] = await Promise.all([
    MyGlobal.prisma.communitybbs_community.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    MyGlobal.prisma.communitybbs_community.count({ where }),
  ]);

  // Calculate total pages
  const pages = Math.ceil(total / limit);

  return {
    pagination: {
      current: page,
      limit,
      records: total,
      pages,
    },
    data: communities,
  };
}
