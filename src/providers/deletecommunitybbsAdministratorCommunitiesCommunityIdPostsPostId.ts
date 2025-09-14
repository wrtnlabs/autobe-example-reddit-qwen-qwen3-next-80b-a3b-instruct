import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { AdministratorPayload } from "../decorators/payload/AdministratorPayload";

export async function deletecommunitybbsAdministratorCommunitiesCommunityIdPostsPostId(props: {
  administrator: AdministratorPayload;
  communityId: string & tags.Format<"uuid">;
  postId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { administrator, communityId, postId } = props;

  const post = await MyGlobal.prisma.communitybbs_post.findUniqueOrThrow({
    where: { id: postId },
    select: {
      id: true,
      communitybbs_community_id: true,
      communitybbs_member_id: true,
      deleted_at: true,
    },
  });

  if (post.communitybbs_community_id !== communityId) {
    throw new Error("Post does not belong to the specified community");
  }

  await MyGlobal.prisma.communitybbs_post.delete({
    where: { id: postId },
  });
}
