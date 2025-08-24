import type { HttpApiSecurity } from "@effect/platform";
import { HttpApp, HttpServerResponse } from "@effect/platform";
import { Effect } from "effect";

export const securityRemoveCookie = (
  self: HttpApiSecurity.ApiKey,
): Effect.Effect<void> => {
  return HttpApp.appendPreResponseHandler((_req, response) =>
    Effect.orDie(
      HttpServerResponse.setCookie(response, self.key, "", {
        secure: true,
        httpOnly: true,
        sameSite: "strict",
        expires: new Date(0),
        path: "/",
      }),
    ),
  );
};
