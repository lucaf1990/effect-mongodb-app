import { HttpApi, OpenApi } from "@effect/platform";
import { AccountApi } from "../Account/api/api.js";

export class MainServiceApi extends HttpApi.make("MainServiceApi")
  .add(AccountApi)
  .annotateContext(
    OpenApi.annotations({
      title: "Effect TS Backend",
      description: `Effect TS Backend Api`,
      identifier: "Api",
    }),
  ) {}
