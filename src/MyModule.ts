import { Module } from "@nestjs/common";

import { AuthGuestController } from "./controllers/auth/guest/AuthGuestController";
import { AuthMemberController } from "./controllers/auth/member/AuthMemberController";
import { AuthAdminController } from "./controllers/auth/admin/AuthAdminController";
import { CommunityplatformRolesController } from "./controllers/communityPlatform/roles/CommunityplatformRolesController";
import { CommunityplatformAdminGuestsController } from "./controllers/communityPlatform/admin/guests/CommunityplatformAdminGuestsController";
import { CommunityplatformAdminMembersController } from "./controllers/communityPlatform/admin/members/CommunityplatformAdminMembersController";
import { CommunityplatformMemberMembersController } from "./controllers/communityPlatform/member/members/CommunityplatformMemberMembersController";
import { CommunityplatformAdminAdminMembersController } from "./controllers/communityPlatform/admin/admin/members/CommunityplatformAdminAdminMembersController";
import { CommunityplatformCommunitiesController } from "./controllers/communityPlatform/communities/CommunityplatformCommunitiesController";
import { CommunityplatformMemberCommunitiesController } from "./controllers/communityPlatform/member/communities/CommunityplatformMemberCommunitiesController";
import { CommunityplatformCommunitiesMembersController } from "./controllers/communityPlatform/communities/members/CommunityplatformCommunitiesMembersController";
import { CommunityplatformMemberCommunitiesMembersController } from "./controllers/communityPlatform/member/communities/members/CommunityplatformMemberCommunitiesMembersController";
import { CommunityplatformPostsController } from "./controllers/communityPlatform/posts/CommunityplatformPostsController";
import { CommunityplatformMemberPostsController } from "./controllers/communityPlatform/member/posts/CommunityplatformMemberPostsController";
import { CommunityplatformPostsCommentsController } from "./controllers/communityPlatform/posts/comments/CommunityplatformPostsCommentsController";
import { CommunityplatformMemberPostsCommentsController } from "./controllers/communityPlatform/member/posts/comments/CommunityplatformMemberPostsCommentsController";
import { CommunityplatformMemberPostsVotesController } from "./controllers/communityPlatform/member/posts/votes/CommunityplatformMemberPostsVotesController";
import { CommunityplatformMemberCommentsVotesController } from "./controllers/communityPlatform/member/comments/votes/CommunityplatformMemberCommentsVotesController";
import { CommunityplatformMemberUsersCommunitiesController } from "./controllers/communityPlatform/member/users/communities/CommunityplatformMemberUsersCommunitiesController";
import { CommunityplatformSearchPostsController } from "./controllers/communityPlatform/search/posts/CommunityplatformSearchPostsController";
import { CommunityplatformSearchSub_communitiesController } from "./controllers/communityPlatform/search/sub-communities/CommunityplatformSearchSub_communitiesController";
import { CommunityplatformSearchCommentsController } from "./controllers/communityPlatform/search/comments/CommunityplatformSearchCommentsController";
import { CommunityplatformAnalyticsCommunitiesMember_countController } from "./controllers/communityPlatform/analytics/communities/member-count/CommunityplatformAnalyticsCommunitiesMember_countController";
import { CommunityplatformAnalyticsPostsScoreController } from "./controllers/communityPlatform/analytics/posts/score/CommunityplatformAnalyticsPostsScoreController";
import { CommunityplatformAnalyticsCommentsScoreController } from "./controllers/communityPlatform/analytics/comments/score/CommunityplatformAnalyticsCommentsScoreController";

@Module({
  controllers: [
    AuthGuestController,
    AuthMemberController,
    AuthAdminController,
    CommunityplatformRolesController,
    CommunityplatformAdminGuestsController,
    CommunityplatformAdminMembersController,
    CommunityplatformMemberMembersController,
    CommunityplatformAdminAdminMembersController,
    CommunityplatformCommunitiesController,
    CommunityplatformMemberCommunitiesController,
    CommunityplatformCommunitiesMembersController,
    CommunityplatformMemberCommunitiesMembersController,
    CommunityplatformPostsController,
    CommunityplatformMemberPostsController,
    CommunityplatformPostsCommentsController,
    CommunityplatformMemberPostsCommentsController,
    CommunityplatformMemberPostsVotesController,
    CommunityplatformMemberCommentsVotesController,
    CommunityplatformMemberUsersCommunitiesController,
    CommunityplatformSearchPostsController,
    CommunityplatformSearchSub_communitiesController,
    CommunityplatformSearchCommentsController,
    CommunityplatformAnalyticsCommunitiesMember_countController,
    CommunityplatformAnalyticsPostsScoreController,
    CommunityplatformAnalyticsCommentsScoreController,
  ],
})
export class MyModule {}
