import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ICommunitybbsPost } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsPost";
import { IPageICommunitybbsPost } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageICommunitybbsPost";

export async function patchcommunitiesCommunityIdPosts(props: {
  communityId: string & tags.Format<"uuid">;
  body: ICommunitybbsPost.IRequest;
}): Promise<IPageICommunitybbsPost> {
  const { communityId, body } = props;

  // Set default values for pagination and sort
  const page = body.page ?? 1;
  const limit = body.limit ?? 20;
  const sort = body.sort ?? "Newest";
  const skip = (page - 1) * limit;

  // Validate sort parameter
  if (sort !== "Newest" && sort !== "Top") {
    throw new Error("Invalid sort value. Must be 'Newest' or 'Top'");
  }

  // Fetch total count of active posts in the community
  const totalCount = await MyGlobal.prisma.communitybbs_post.count({
    where: {
      communitybbs_community_id: communityId,
      deleted_at: null,
    },
  });

  // Fetch paginated posts
  const rawPosts = await MyGlobal.prisma.communitybbs_post.findMany({
    where: {
      communitybbs_community_id: communityId,
      deleted_at: null,
    },
    orderBy:
      sort === "Top"
        ? { created_at: "desc", id: "desc" }
        : { created_at: "desc", id: "desc" },
    skip,
    take: limit,
    include: {
      communitybbs_vote: true,
    },
  });

  // Group by post_id to calculate scores
  const postMap = new Map<
    string,
    {
      id: string;
      communitybbs_community_id: string;
      communitybbs_member_id: string;
      title: string;
      body: string;
      display_name: string | undefined;
      created_at: Date;
      updated_at: Date | null;
      deleted_at: Date | null;
      upvotes: number;
      downvotes: number;
    }
  >();

  rawPosts.forEach((post) => {
    if (!postMap.has(post.id)) {
      postMap.set(post.id, {
        id: post.id,
        communitybbs_community_id: post.communitybbs_community_id,
        communitybbs_member_id: post.communitybbs_member_id,
        title: post.title,
        body: post.body,
        display_name:
          post.display_name === null ? undefined : post.display_name, // Convert null to undefined
        created_at: post.created_at,
        updated_at: post.updated_at,
        deleted_at: post.deleted_at,
        upvotes: 0,
        downvotes: 0,
      });
    }
    const record = postMap.get(post.id)!;
    if (post.communitybbs_vote) {
      post.communitybbs_vote.forEach((vote) => {
        if (vote.type === "upvote") record.upvotes++;
        else if (vote.type === "downvote") record.downvotes++;
      });
    }
  });

  // Sort manually by score if 'Top'
  const sortedPosts = Array.from(postMap.values()).sort((a, b) => {
    const scoreA = a.upvotes - a.downvotes;
    const scoreB = b.upvotes - b.downvotes;

    if (sort === "Top") {
      if (scoreB !== scoreA) return scoreB - scoreA;
      if (b.created_at.getTime() !== a.created_at.getTime())
        return b.created_at.getTime() - a.created_at.getTime();
      return b.id > a.id ? 1 : -1;
    } else {
      if (b.created_at.getTime() !== a.created_at.getTime())
        return b.created_at.getTime() - a.created_at.getTime();
      return b.id > a.id ? 1 : -1;
    }
  });

  // Transform to ICommunitybbsPost
  const posts: ICommunitybbsPost[] = sortedPosts.map((item) => ({
    id: item.id,
    communitybbs_community_id: item.communitybbs_community_id,
    communitybbs_member_id: item.communitybbs_member_id,
    title: item.title,
    body: item.body,
    display_name: item.display_name, // Now safely typed as string | undefined
    created_at: toISOStringSafe(item.created_at),
    updated_at: item.updated_at ? toISOStringSafe(item.updated_at) : undefined,
    deleted_at: item.deleted_at ? toISOStringSafe(item.deleted_at) : undefined,
  }));

  // Page information
  const pagination = {
    current: page,
    limit: limit,
    records: totalCount,
    pages: Math.ceil(totalCount / limit),
  };

  return {
    pagination,
    data: posts,
  };
}
