import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunitybbsAdministrator } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsAdministrator";
import type { ICommunitybbsCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsCommunity";
import type { IResponseEmpty } from "@ORGANIZATION/PROJECT-api/lib/structures/IResponseEmpty";

export async function test_api_community_permanent_deletion_by_admin(
  connection: api.IConnection,
) {
  // Generate a valid community name that conforms to the schema
  const communityName: string = typia.random<
    string &
      tags.MinLength<3> &
      tags.MaxLength<32> &
      tags.Pattern<"^[a-z0-9_-]+$">
  >();

  // Call the permanent delete endpoint with the generated community name
  const deleteResponse: IResponseEmpty =
    await api.functional.admin.communities.permanent_delete.eraseAll(
      connection,
      {
        name: communityName,
      },
    );

  // Validate that the response type is IResponseEmpty
  typia.assert(deleteResponse);
}
