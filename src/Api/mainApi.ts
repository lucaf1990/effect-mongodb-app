import { HttpApi, OpenApi } from "@effect/platform";
import { AccountApi } from "../Account/api/api.js";
import { InvitationApi } from "../Invitation/api/api.js";

export class MainServiceApi extends HttpApi.make("MainServiceApi")
  .add(AccountApi)
  .add(InvitationApi)
  .annotateContext(
    OpenApi.annotations({
      title: "Effect TS Backend",
      description: `Effect TS Backend Api`,
      identifier: "Api",
    }),
  ) {}
