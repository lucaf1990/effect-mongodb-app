import { HttpApiBuilder } from "@effect/platform";
import { Effect, Layer } from "effect";

import { AuthenticationLive } from "../../Authentication/authentication.js";
import {
  policyUse,
  withSystemActor,
} from "../../Authentication/authorization.js";
import { MainServiceApi } from "../../Api/mainApi.js";
import { InvitationPolicy } from "../policies/invitationPolicy.js";
import { InvitationService } from "../service/invitationService.js";

export const InvitationApiLive = HttpApiBuilder.group(
  MainServiceApi,
  "invitations",
  (handlers) =>
    Effect.gen(function* () {
      const invitationService = yield* InvitationService;
      const invitationPolicy = yield* InvitationPolicy;

      return handlers
        .handle("createInvitation", ({ payload }) =>
          invitationService
            .createInvitation(
              payload.email,
              payload.senderId,
              payload.intendedRole,
            )
            .pipe(policyUse(invitationPolicy.canSendInvitation())),
        )
        .handle("verifyInvitation", ({ urlParams }) =>
          invitationService
            .verifyInvitationToken(urlParams.invitationToken)
            .pipe(withSystemActor),
        )
        .handle("findByEmail", ({ payload }) =>
          invitationService
            .findInvitationByEmail(payload.recipientEmail)
            .pipe(policyUse(invitationPolicy.canRead())),
        )
        .handle("findById", ({ path }) =>
          invitationService
            .findInvitationById(path.invitationId)
            .pipe(policyUse(invitationPolicy.canRead())),
        )
        .handle("getAllInvitations", ({ urlParams }) =>
          invitationService
            .getAllInvitations(urlParams.accountId)
            .pipe(policyUse(invitationPolicy.canReadAll())),
        )
        .handle("deleteInvitation", ({ path }) =>
          invitationService
            .deleteInvitation(path.invitationId)
            .pipe(policyUse(invitationPolicy.canDelete())),
        );
    }),
).pipe(
  Layer.provide(AuthenticationLive),
  Layer.provide(InvitationService.Default),
  Layer.provide(InvitationPolicy.Default),
);
