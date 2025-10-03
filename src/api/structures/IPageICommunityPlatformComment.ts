import { IPage } from "./IPage";
import { ICommunityPlatformComment } from "./ICommunityPlatformComment";

export namespace IPageICommunityPlatformComment {
  /**
   * A page.
   *
   * Collection of records with pagination information.
   */
  export type ISparse = {
    /** Page information. */
    pagination: IPage.IPagination;

    /** List of records. */
    data: ICommunityPlatformComment.ISparse[];
  };
}
