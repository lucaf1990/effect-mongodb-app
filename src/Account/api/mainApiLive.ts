import { HttpApiBuilder } from "@effect/platform";
import { Layer } from "effect";
import { MainServiceApi } from "./mainApi.js";
import { AccountApiLive } from "./apiLive.js";
export const MainServiceApiLive = HttpApiBuilder.api(MainServiceApi).pipe(
  Layer.provide([AccountApiLive]),
);
