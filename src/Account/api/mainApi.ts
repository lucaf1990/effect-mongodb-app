import { HttpApi, OpenApi } from "@effect/platform";
import { AccountApi } from "./api.js";

export class MainServiceApi extends HttpApi.make("MainServiceApi")
  .add(AccountApi)
  .annotateContext(
    OpenApi.annotations({
      title: "Effect TS Backend",
      description: `Effect TS Backend Api`,
      identifier: "Api",
      transform: (openApiSpec) => {
        const newPaths = Object.fromEntries(
          Object.entries(openApiSpec.paths).filter(([path]) => path !== "/"),
        );
        return {
          ...openApiSpec,
          paths: newPaths,
        };
      },
    }),
  ) { }
