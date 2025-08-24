import { HttpApiBuilder } from "@effect/platform";
import { Layer } from "effect";
import { MainServiceApi } from "./mainApi.js";
import { AccountApiLive } from "../Account/api/apiLive.js";
export const MainServiceApiLive = HttpApiBuilder.api(MainServiceApi).pipe(
  Layer.provide([AccountApiLive]),
);
