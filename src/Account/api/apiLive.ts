import { HttpApiBuilder } from "@effect/platform";
import { Effect, Layer } from "effect";
import { AuthenticationLive } from "../../Authentication/authentication.js";
import {
  policyUse,
  withSystemActor,
} from "../../Authentication/authorization.js";
import { MainServiceApi } from "../../Api/mainApi.js";
import { AccountPolicy } from "../policies/accountPolicy.js";
import { AccountService } from "../services/accountService.js"; // Your existing service
import { CurrentAccount } from "../schemas/account.js";

export const AccountApiLive = HttpApiBuilder.group(
  MainServiceApi,
  "people",
  (handlers) =>
    Effect.gen(function* () {
      const accountService = yield* AccountService;
      const accountPolicy = yield* AccountPolicy;
      return handlers
        .handle("signUp", ({ payload }) =>
          accountService.signUp(payload).pipe(withSystemActor),
        )
        .handle("verify_token", ({ urlParams }) =>
          accountService.verifyAccount(
            urlParams.token,
            urlParams.isAFrontEndRequest ?? false,
          ),
        )
        .handle("signIn", ({ payload }) =>
          accountService.signIn(payload).pipe(withSystemActor),
        )
        .handle("findById", ({ path }) =>
          accountService.findAccountById(path.accountId),
        )
        .handle("updateById", ({ path, payload }) => {
          return accountService
            .updateAccountById(path.accountId, payload)
            .pipe(policyUse(accountPolicy.canUpdate(path.accountId)));
        })
        .handle("isAccountVerified", ({ urlParams }) =>
          accountService
            .isAccountVerified(urlParams.accountId)
            .pipe(policyUse(accountPolicy.canRead(urlParams.accountId))),
        )
        .handle("myAccount", () => CurrentAccount)
        .handle("invalidate", ({ headers }) =>
          accountService.invalidate(headers["refresh-token"]),
        )
        .handle("getAllAccounts", ({ urlParams }) =>
          accountService
            .getAllAccounts(urlParams.accountId)
            .pipe(policyUse(accountPolicy.canRead(urlParams.accountId))),
        );
    }),
).pipe(
  Layer.provide(AuthenticationLive),
  Layer.provide(AccountService.Default),
  Layer.provide(AccountPolicy.Default),
);
