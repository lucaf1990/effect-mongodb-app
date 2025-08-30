import {
  HttpApiEndpoint,
  HttpApiGroup,
  HttpApiSchema,
  OpenApi,
} from "@effect/platform";
import { Schema } from "effect";
import { Forbidden } from "@effect/platform/HttpApiError";
import { ServerError } from "../../Schemas/Common/commonError.js";
import { Authentication } from "../../Authentication/authentication.js";
import { ObjectId } from "mongodb";
import { Email } from "../../Schemas/Common/email.js";
import { AccountId } from "../../Account/schemas/account.js";
import {
  Invitation,
  InvitationId,
  InvitationNotFound,
  Role,
} from "../schemas/invitation.js";
import { VerifyTokenError } from "../../Crypto/errors/tokenErrors.js";

export const InvitationIdFromString = Schema.transform(
  Schema.String,
  InvitationId,
  {
    decode: (str) => new ObjectId(str) as InvitationId,
    encode: (invitationId) => invitationId.toString(),
  },
).pipe(
  Schema.annotations({
    identifier: "InvitationIdFromString",
    description: "Invitation ID from URL parameter",
    jsonSchema: { type: "string" },
  }),
);

export const AccountIdFromString = Schema.transform(Schema.String, AccountId, {
  decode: (str) => new ObjectId(str) as AccountId,
  encode: (accountId) => accountId.toString(),
}).pipe(
  Schema.annotations({
    identifier: "AccountIdFromString",
    description: "Account ID from URL parameter",
    jsonSchema: { type: "string" },
  }),
);

const idParam = HttpApiSchema.param("invitationId", InvitationIdFromString);

export class InvitationApi extends HttpApiGroup.make("invitations")
  .add(
    HttpApiEndpoint.post("createInvitation", "/create")
      .middleware(Authentication)
      .setPayload(
        Schema.Struct({
          email: Email,
          senderId: AccountIdFromString,
          intendedRole: Role.pipe(
            Schema.optional,
            Schema.withConstructorDefault(() => "user" as const),
          ),
        }),
      )
      .addSuccess(Invitation)
      .addError(ServerError)
      .addError(Forbidden)
      .annotateContext(
        OpenApi.annotations({
          title: "Create Invitation",
          description:
            "Creates a new invitation and sends it via email. Requires admin or moderator role.",
          summary: "Create a new invitation",
        }),
      ),
  )
  .add(
    HttpApiEndpoint.get("verifyInvitation")`/verify`
      .setUrlParams(
        Schema.Struct({
          invitationToken: Schema.Redacted(Schema.String),
        }),
      )
      .addSuccess(Invitation)
      .addError(VerifyTokenError)
      .addError(InvitationNotFound)
      .addError(Forbidden)
      .annotateContext(
        OpenApi.annotations({
          title: "Verify Invitation",
          description: "Verifies an invitation token and marks it as accepted.",
          summary: "Verify invitation token",
        }),
      ),
  )
  .add(
    HttpApiEndpoint.post("findByEmail", "/findByEmail")
      .middleware(Authentication)
      .setPayload(
        Schema.Struct({
          recipientEmail: Email,
        }),
      )
      .addSuccess(Invitation)
      .addError(InvitationNotFound)
      .addError(Forbidden)
      .annotateContext(
        OpenApi.annotations({
          title: "Find Invitation by Email",
          description:
            "Finds an invitation by recipient email. Requires proper authorization.",
          summary: "Find invitation by email",
        }),
      ),
  )
  .add(
    HttpApiEndpoint.get("findById")`/${idParam}`
      .middleware(Authentication)
      .addSuccess(Invitation)
      .addError(InvitationNotFound)
      .addError(Forbidden)
      .annotateContext(
        OpenApi.annotations({
          title: "Find Invitation by ID",
          description:
            "Finds an invitation by its ID. Requires proper authorization.",
          summary: "Find invitation by ID",
        }),
      ),
  )
  .add(
    HttpApiEndpoint.get("getAllInvitations", "/all")
      .middleware(Authentication)
      .setUrlParams(
        Schema.Struct({
          accountId: AccountIdFromString,
        }),
      )
      .addSuccess(Schema.Array(Invitation))
      .addError(Forbidden)
      .annotateContext(
        OpenApi.annotations({
          title: "Get All Invitations",
          description:
            "Retrieves all invitations. Requires admin or moderator role.",
          summary: "Get all invitations",
        }),
      ),
  )
  .add(
    HttpApiEndpoint.del("deleteInvitation")`/${idParam}`
      .middleware(Authentication)
      .addSuccess(
        Schema.Struct({
          success: Schema.Boolean,
          message: Schema.String,
        }),
      )
      .addError(InvitationNotFound)
      .addError(Forbidden)
      .annotateContext(
        OpenApi.annotations({
          title: "Delete Invitation",
          description:
            "Deletes an invitation. Requires admin or moderator role.",
          summary: "Delete invitation",
        }),
      ),
  )
  .prefix("/api/invitations")
  .annotateContext(
    OpenApi.annotations({
      title: "Invitation API",
    }),
  ) {}
