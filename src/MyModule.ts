import { Module } from "@nestjs/common";

import { AuthGuestController } from "./controllers/auth/guest/AuthGuestController";
import { AuthMemberController } from "./controllers/auth/member/refresh/AuthMemberController";
import { MyPostsController } from "./controllers/my/posts/MyPostsController";
import { PostsController } from "./controllers/posts/PostsController";
import { MyCommentsController } from "./controllers/my/comments/MyCommentsController";
import { CommentsController } from "./controllers/comments/CommentsController";
import { VotesController } from "./controllers/votes/VotesController";
import { CommunitiesJoinController } from "./controllers/communities/join/CommunitiesJoinController";
import { CommunitiesLeaveController } from "./controllers/communities/leave/CommunitiesLeaveController";
import { AuthAdministratorController } from "./controllers/auth/administrator/refresh/AuthAdministratorController";
import { AdminCommunitiesController } from "./controllers/admin/communities/AdminCommunitiesController";
import { AdminCommunitiesPermanent_deleteController } from "./controllers/admin/communities/permanent-delete/AdminCommunitiesPermanent_deleteController";
import { AdminAdministratorsController } from "./controllers/admin/administrators/AdminAdministratorsController";
import { AdminMembersController } from "./controllers/admin/members/AdminMembersController";
import { CommunitybbsCommunitiesController } from "./controllers/communitybbs/communities/CommunitybbsCommunitiesController";
import { CommunitybbsMemberCommunitiesController } from "./controllers/communitybbs/member/communities/CommunitybbsMemberCommunitiesController";
import { CommunitybbsAdministratorCommunitiesController } from "./controllers/communitybbs/administrator/communities/CommunitybbsAdministratorCommunitiesController";
import { CommunitybbsCommunitiesPostsController } from "./controllers/communitybbs/communities/posts/CommunitybbsCommunitiesPostsController";
import { CommunitybbsMemberCommunitiesPostsController } from "./controllers/communitybbs/member/communities/posts/CommunitybbsMemberCommunitiesPostsController";
import { CommunitiesController } from "./controllers/communities/CommunitiesController";
import { CommunitiesPostsController } from "./controllers/communities/posts/CommunitiesPostsController";
import { CommunitybbsMemberCommunitiesPostsCommentsController } from "./controllers/communitybbs/member/communities/posts/comments/CommunitybbsMemberCommunitiesPostsCommentsController";
import { CommunitybbsAdministratorCommunitiesPostsCommentsController } from "./controllers/communitybbs/administrator/communities/posts/comments/CommunitybbsAdministratorCommunitiesPostsCommentsController";
import { CommunitybbsAdministratorCommunitiesPostsController } from "./controllers/communitybbs/administrator/communities/posts/CommunitybbsAdministratorCommunitiesPostsController";
import { CommunitybbsMemberCommunitiesPostsVotesController } from "./controllers/communitybbs/member/communities/posts/votes/CommunitybbsMemberCommunitiesPostsVotesController";
import { CommunitiesPostsCommentsController } from "./controllers/communities/posts/comments/CommunitiesPostsCommentsController";
import { CommunitiesPostsVotesController } from "./controllers/communities/posts/votes/CommunitiesPostsVotesController";
import { CommunitybbsMemberCommunitiesPostsCommentsVotesController } from "./controllers/communitybbs/member/communities/posts/comments/votes/CommunitybbsMemberCommunitiesPostsCommentsVotesController";
import { CommunitybbsController } from "./controllers/communitybbs/search/CommunitybbsController";

@Module({
  controllers: [
    AuthGuestController,
    AuthMemberController,
    MyPostsController,
    PostsController,
    MyCommentsController,
    CommentsController,
    VotesController,
    CommunitiesJoinController,
    CommunitiesLeaveController,
    AuthAdministratorController,
    AdminCommunitiesController,
    AdminCommunitiesPermanent_deleteController,
    AdminAdministratorsController,
    AdminMembersController,
    CommunitybbsCommunitiesController,
    CommunitybbsMemberCommunitiesController,
    CommunitybbsAdministratorCommunitiesController,
    CommunitybbsCommunitiesPostsController,
    CommunitybbsMemberCommunitiesPostsController,
    CommunitiesController,
    CommunitiesPostsController,
    CommunitybbsMemberCommunitiesPostsCommentsController,
    CommunitybbsAdministratorCommunitiesPostsCommentsController,
    CommunitybbsAdministratorCommunitiesPostsController,
    CommunitybbsMemberCommunitiesPostsVotesController,
    CommunitiesPostsCommentsController,
    CommunitiesPostsVotesController,
    CommunitybbsMemberCommunitiesPostsCommentsVotesController,
    CommunitybbsController,
  ],
})
export class MyModule {}
