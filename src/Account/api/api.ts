import {
  HttpApiEndpoint,
  HttpApiGroup,
  HttpApiSchema,
  OpenApi,
} from "@effect/platform";
import { Schema } from "effect";
import { Forbidden } from "@effect/platform/HttpApiError";
import { Account, AccountId } from "../schemas/account.js";
import { ServerError } from "../../Schemas/Common/commonError.js";
import { Utc } from "effect/DateTime";
import { Authentication } from "../../Authentication/authentication.js";
import {
  GeneratingSaltError,
  HashingPasswordError,
} from "../../Crypto/errors/cryptoErrors.js";
import {
  EmailVerificationTokenGenerationError,
  VerifyTokenError,
} from "../../Crypto/errors/tokenErrors.js";
import {
  AccountNotFound,
  EmailNotVerifiedError,
  AccountAlreadyExists,
  InvalidPassword,
} from "../schemas/accountErrors.js";
import { SignIn } from "../schemas/signIn.js";
import { SignUp } from "../schemas/signUp.js";
import { ObjectId } from "mongodb";

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
const idParam = HttpApiSchema.param("accountId", AccountIdFromString);

export class AccountApi extends HttpApiGroup.make("people")
  .add(
    HttpApiEndpoint.post("signUp", "/sign-up")
      .setPayload(SignUp)
      .addSuccess(Account)
      .addError(GeneratingSaltError)
      .addError(AccountNotFound)
      .addError(EmailVerificationTokenGenerationError)
      .addError(EmailNotVerifiedError)
      .addError(HashingPasswordError)
      .addError(ServerError)
      .addError(AccountAlreadyExists)
      .annotateContext(
        OpenApi.annotations({
          title: "Sign Up",
          description:
            "Signs up a new account. Returns 409 if the email is already registered. Can be used without logging in.",
          summary: "Signs up a new account",
        }),
      ),
  )
  .add(
    HttpApiEndpoint.get("verify_token")`/verify`
      .setUrlParams(
        Schema.Struct({
          token: Schema.String,
          isAFrontEndRequest: Schema.optional(
            Schema.BooleanFromString.annotations({
              default: false,
            }),
          ),
        }),
      )
      .addSuccess(
        Schema.String.annotations({
          description: "HTML page with a verification success page",
          examples: [
            `<!DOCTYPE html> <title>Email Verified Successfully</title> </html>`,
          ],
        }).pipe(
          HttpApiSchema.withEncoding({
            kind: "Text",
            contentType: "text/html",
          }),
        ),
      )
      .addSuccess(
        Schema.Struct({
          status: Schema.Number,
          message: Schema.String,
          timestamp: Schema.DateTimeUtc,
        }).annotations({
          description: "Response with status, message, and timestamp",
          examples: [
            {
              status: 200,
              message: "Email verified successfully",
              timestamp: "2022-09-15T16:30:45.678Z" as unknown as Utc,
            },
          ],
        }),
      )
      .addError(VerifyTokenError)
      .addError(
        Schema.String.annotations({
          description: "HTML page with a verification success page",
          examples: [
            `<!DOCTYPE html> <title>Email Verification Failed</title> </html>`,
          ],
        }).pipe(
          HttpApiSchema.withEncoding({
            kind: "Text",
            contentType: "text/html",
          }),
        ),
      )
      .annotateContext(
        OpenApi.annotations({
          title: "Verify the account email",
          description: "Accept a token to verify the user account",
          summary:
            "Accept a token and uses it to verify the user account and an optional boolean to verify if is a front-end requests",
        }),
      ),
  )
  .add(
    HttpApiEndpoint.post("signIn", "/sign-in")
      .setPayload(SignIn)
      .addSuccess(
        Schema.Struct({
          account: Account,
          accessToken: Schema.String,
          refreshToken: Schema.String,
        }),
      )
      .addError(AccountNotFound)
      .addError(InvalidPassword)
      .annotateContext(
        OpenApi.annotations({
          title: "Sign In",
          description:
            "Signs in to an account. Returns 404 if the account does not exist or the password is incorrect.",
          summary: "Signs in to an account",
        }),
      ),
  )
  .add(
    HttpApiEndpoint.get("getAllAccounts", "/getAllAccounts")

      .middleware(Authentication)
      .setUrlParams(
        Schema.Struct({
          accountId: AccountIdFromString,
        }),
      )
      .addSuccess(Schema.Array(Account))
      .addError(Schema.Any)
      .annotateContext(
        OpenApi.annotations({
          title: "Sign In",
          description:
            "Signs in to an account. Returns 404 if the account does not exist or the password is incorrect.",
          summary: "Signs in to an account",
        }),
      ),
  )
  .add(
    HttpApiEndpoint.get("myAccount", "/myAccount")
      .middleware(Authentication)
      .addSuccess(Account)
      .addError(AccountNotFound)
      .annotateContext(
        OpenApi.annotations({
          title: "Get My Account",
          description: "Gets your account. Must be logged in to use.",
          summary: "Get My Account",
        }),
      ),
  )
  .add(
    HttpApiEndpoint.get("findById")`/${idParam}`
      .middleware(Authentication)
      .addError(AccountNotFound)
      .addSuccess(Account)
      .annotateContext(
        OpenApi.annotations({
          title: "Find Account",
          description:
            "Finds an account. Returns 404 if the account does not exist. You can view other people's accounts if not private",
          summary: "Find an account by id",
        }),
      ),
  )
  .add(
    HttpApiEndpoint.patch("updateById")`/${idParam}`
      .middleware(Authentication)
      .setPayload(
        Schema.partialWith(
          Account.pick(
            "firstName",
            "lastName",
            // 'email', // TODO: Email Service first
            "profileImageUrl",
            "bio",
            "externalUrls",
            "phoneNumber",
            "dateOfBirth",
            "username",
            "isPrivate",
          ),
          {
            exact: true,
          },
        ),
      )
      .addSuccess(Account)
      .addError(AccountNotFound)
      .addError(Forbidden)
      .annotateContext(
        OpenApi.annotations({
          title: "Update Account Details",
          description:
            "Updates the details of an account. You cannot update other people's accounts. Must be logged in to use. Admins can update other people's accounts.",
          override: {
            summary: "Update Single Account",
          },
        }),
      ),
  )
  .add(
    HttpApiEndpoint.get("isAccountVerified", `/isAccountVerified`)
      .middleware(Authentication)
      .setUrlParams(
        Schema.Struct({
          accountId: AccountIdFromString,
        }),
      )
      .addSuccess(Schema.Any)
      .addError(Schema.Any)
      .addError(ServerError)
      .annotateContext(
        OpenApi.annotations({
          title: "Verify email exsist",
          description:
            "Given an id check if the account has been verified or not",
          summary: "Signs up a new account",
        }),
      ),
  )
  .add(
    HttpApiEndpoint.post("invalidate", "/invalidate")
      .setHeaders(
        Schema.Struct({
          "refresh-token": Schema.String,
        }),
      )
      .middleware(Authentication)
      .addError(VerifyTokenError)
      .addSuccess(
        Schema.Struct({
          accessToken: Schema.String,
          refreshToken: Schema.String,
        }),
      )
      .annotateContext(
        OpenApi.annotations({
          title: "Reissue Tokens",
          description:
            "Reissues access and refresh tokens using the refresh token. Must be logged in to use.",
          summary: "Reissue Tokens",
        }),
      ),
  )
  .prefix("/api/accounts")
  .annotateContext(
    OpenApi.annotations({
      title: "Account API",
    }),
  ) {}
