import { DateTime, Effect, Option, pipe, Redacted } from "effect";

import { policyRequire } from "../../Authentication/authorization.js";
import { ConfigService } from "../../Configuration/configurationService.js";
import { VerifyTokenError } from "../../Crypto/errors/tokenErrors.js";
import { CryptoService } from "../../Crypto/services/cryptoService.js";
import { TokenService } from "../../Crypto/services/tokenService.js";
import { EmailService } from "../../Email/emailService.js";
import { ServerError } from "../../Schemas/Common/commonError.js";
import { Email } from "../../Schemas/Common/email.js";
import { renderTemplate } from "../../Templates/Utils.js";
import { AccountRepository } from "../repositories/accountRepository.js";
import { AccountVerificationService } from "./accountVerificationService.js";
import type { AccountId } from "../schemas/account.js";
import { Account } from "../schemas/account.js";
import {
  AccountAlreadyExists,
  AccountByEmailNotFound,
  AccountNotFound,
  EmailNotVerifiedError,
  InvalidPassword,
} from "../schemas/accountErrors.js";
import type { SignIn } from "../schemas/signIn.js";
import type { SignUp } from "../schemas/signUp.js";

export class AccountService extends Effect.Service<AccountService>()(
  "AccountService",
  {
    effect: Effect.gen(function* () {
      const cryptoService = yield* CryptoService;
      const tokenService = yield* TokenService;
      const accountRepo = yield* AccountRepository;
      const accountVerificationService = yield* AccountVerificationService;
      const emailService = yield* EmailService;
      const configService = yield* ConfigService;

      const host = configService.host;
      const port = configService.port;

      const signUp = (signUp: SignUp) => {
        const program = Effect.gen(function* () {
          yield* Effect.annotateCurrentSpan("account", signUp);

          const maybeAccount = yield* accountRepo.findByEmail(signUp.email);

          yield* Option.match(maybeAccount, {
            onNone: () => Effect.succeed(null),
            onSome: (account) =>
              Effect.fail(new AccountAlreadyExists({ email: account.email })),
          });

          const salt = yield* cryptoService.getRandomSalt();
          const hashedPassword = yield* cryptoService.hashPassword(
            Redacted.value(signUp.password),
            salt,
          );

          // MongoDB version - manual object creation instead of Account.insert.make
          const newAccount = yield* accountRepo
            .insertOne({
              lastName: "",
              firstName: "",
              phoneNumber: null,
              isEmailVerified: false,
              role: "user",
              username: signUp.username,
              bio: null,
              dateOfBirth: null,
              externalUrls: null,
              isPrivate: false,
              profileImageUrl: null,
              email: signUp.email,
              passwordHash: hashedPassword,
              passwordSalt: Redacted.make(salt),
              createdAt: new Date(),
              updatedAt: new Date(),
            })
            .pipe(
              Effect.catchAll(() => {
                return Effect.fail(
                  new ServerError({
                    message: `Failed to create account: ${signUp.email}`,
                  }),
                );
              }),
              Effect.withSpan("AccountService.signUp.insert"),
            );

          const emailVerificationToken =
            yield* tokenService.generateEmailVerificationToken(signUp);

          // MongoDB version - manual object creation
          yield* accountVerificationService.insert({
            verificationCode: Redacted.make(emailVerificationToken),
            email: newAccount.email,
            validUntil: new Date(Date.now() + 1 * 60 * 60 * 1000),
            isSent: true,
            isVerified: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          yield* emailService.sendEmail({
            to: newAccount.email,
            subject: "Verify your email address",
            templateName: "src/Templates/verficationAccount.html",
            templateParams: {
              emailVerificationToken: encodeURIComponent(
                emailVerificationToken,
              ),
              link: host + port,
              entity: "accounts/verify",
              firstName: newAccount.firstName || "user",
            },
          });

          return newAccount;
        });

        return program.pipe(
          Effect.withSpan("AccountService.signUp", {
            attributes: { signUp },
          }),
          policyRequire("account", "create"),
        );
      };

      const verifyAccount = (
        accountVerificationToken: string,
        isAFrontEndRequest: boolean,
      ) =>
        Effect.gen(function* () {
          yield* Effect.annotateCurrentSpan(
            "account",
            accountVerificationToken,
          );

          const decodedToken = decodeURIComponent(accountVerificationToken);
          const decoded = yield* tokenService.verifyToken(decodedToken);
          const email = decoded.sub;

          const account =
            yield* accountVerificationService.findAccountVerificationByEmail(
              email,
            );
          const storedVerificationCode = Redacted.value(
            account.verificationCode,
          );

          if (storedVerificationCode === decodedToken) {
            yield* accountRepo.updateByEmail(email, {
              isEmailVerified: true,
              updatedAt: new Date(),
            });
            yield* accountVerificationService.updateByEmail(email, {
              ...account,
              isVerified: true,
              verificationCode: Redacted.make(""),
              updatedAt: new Date(),
            });

            const html = yield* renderTemplate(
              "./src/templates/emailVerificationSuccess.html",
              {},
            );
            return isAFrontEndRequest
              ? yield* Effect.succeed({
                  status: 200,
                  message: `Email verification successful`,
                  timestamp: yield* DateTime.now,
                })
              : yield* Effect.succeed(html);
          }
          const html = yield* renderTemplate(
            "./src/templates/emailVerificationFail.html",
            {},
          );
          return isAFrontEndRequest
            ? yield* Effect.succeed({
                status: 407,
                message: `The verification code is not valid`,
                timestamp: yield* DateTime.now,
              })
            : yield* Effect.succeed(html);
        }).pipe(
          Effect.catchAll(() => {
            return Effect.fail(new VerifyTokenError());
          }),
          Effect.withSpan("AccountService.accountVerificationToken", {
            attributes: { accountVerificationToken },
          }),
        );

      const signIn = (signIn: SignIn) =>
        Effect.gen(function* () {
          const maybeAccount = yield* accountRepo.findByEmail(signIn.email);

          const account = yield* Option.match(maybeAccount, {
            onNone: () => Effect.fail(new AccountNotFound()),
            onSome: (account) => Effect.succeed(account),
          });

          if (!account.isEmailVerified) {
            return yield* Effect.fail(
              new EmailNotVerifiedError({ email: signIn.email }),
            );
          }

          const isValid = yield* cryptoService.verifyPassword(
            account.passwordHash,
            Redacted.value(signIn.password),
            Redacted.value(account.passwordSalt),
          );

          if (!isValid) {
            return yield* Effect.fail(new InvalidPassword());
          }

          const accessToken = yield* tokenService.generateAccessToken(account);
          const refreshToken =
            yield* tokenService.generateRefreshToken(account);

          return { account, accessToken, refreshToken };
        }).pipe(
          Effect.catchAll((e) => {
            return Effect.fail(e);
          }),
          Effect.withSpan("AccountService.signIn", {
            attributes: { email: signIn.email },
          }),
        );

      const findAccountByEmail = (email: Email) =>
        Effect.gen(function* () {
          yield* Effect.annotateCurrentSpan("account", email);

          const account = yield* accountRepo.findByEmail(email);

          const matched = yield* Option.match(account, {
            onNone: () => Effect.fail(new AccountByEmailNotFound({ email })),
            onSome: (account) => Effect.succeed(account),
          });

          return matched;
        }).pipe(
          Effect.orDie,
          policyRequire("account", "read"),
          Effect.withSpan("AccountService.findAccountByEmail", {
            attributes: { email },
          }),
        );

      const findAccountById = (_id: AccountId) =>
        Effect.gen(function* () {
          yield* Effect.annotateCurrentSpan("account", _id);

          const account = yield* accountRepo.findById(_id);

          const matched = yield* Option.match(account, {
            onNone: () => Effect.fail(new AccountNotFound({ id: _id })),
            onSome: (account) => Effect.succeed(account),
          });

          return matched;
        }).pipe(
          Effect.orDie,
          Effect.withSpan("AccountService.findAccountById", {
            attributes: { _id },
          }),
        );

      const isAccountVerified = (accountId: AccountId) =>
        Effect.gen(function* () {
          const maybeAccount = yield* accountRepo.findById(accountId);
          const isAccountVerified = Option.match(maybeAccount, {
            onNone: () => Effect.fail(new AccountNotFound()),
            onSome: (account) =>
              Effect.succeed(account).pipe(
                Effect.andThen((acc) =>
                  acc.isEmailVerified
                    ? Effect.succeed({
                        success: true,
                        message: "Account is verified",
                      })
                    : Effect.fail({
                        success: false,
                        message: "Account is not verified",
                      }),
                ),
              ),
          });
          return yield* isAccountVerified;
        }).pipe(
          Effect.catchAll((e) => {
            return Effect.fail(e);
          }),
          Effect.withSpan("AccountService.isAccountVerified", {
            attributes: { accountId },
          }),
          policyRequire("account", "read"),
        );

      const updateAccountById = (
        _id: AccountId,
        accountUpdates: Partial<Account>,
      ) =>
        accountRepo.with_(_id, () =>
          pipe(
            accountRepo.updateById(_id, accountUpdates),
            policyRequire("account", "update"),
            Effect.andThen((updated) =>
              updated
                ? accountRepo.findById(_id).pipe(
                    Effect.flatMap((maybeAccount) =>
                      Option.match(maybeAccount, {
                        onNone: () =>
                          Effect.fail(new AccountNotFound({ id: _id })),
                        onSome: (account) => Effect.succeed(account),
                      }),
                    ),
                  )
                : Effect.fail(new AccountNotFound({ id: _id })),
            ),
          ),
        );

      const invalidate = (refreshToken: string) =>
        Effect.gen(function* () {
          const decoded = yield* tokenService.verifyToken(refreshToken);

          const maybeAccount = yield* accountRepo.findByEmail(decoded.sub);

          const account = yield* Option.match(maybeAccount, {
            onNone: () =>
              Effect.fail(
                new AccountByEmailNotFound({
                  email: decoded.sub,
                }),
              ),
            onSome: (account) => Effect.succeed(account),
          });

          const accessToken = yield* tokenService.generateAccessToken(account);
          const newRefreshToken =
            yield* tokenService.generateRefreshToken(account);

          return { accessToken, refreshToken: newRefreshToken };
        }).pipe(
          Effect.catchAll((e) => {
            return Effect.fail(e);
          }),
          Effect.withSpan("AccountService.invalidate", {
            attributes: { refreshToken },
          }),
        );

      const getAllAccounts = (accountId: AccountId) =>
        Effect.gen(function* () {
          return yield* accountRepo.getAllAccounts();
        }).pipe(
          Effect.withSpan("AccountService.getAllAccounts", {
            attributes: { accountId },
          }),
          policyRequire("account", "read"),
        );

      return {
        signUp,
        signIn,
        verifyAccount,
        isAccountVerified,
        findAccountByEmail,
        findAccountById,
        updateAccountById,
        invalidate,
        getAllAccounts,
      } as const;
    }),
    dependencies: [
      AccountRepository.Default,
      CryptoService.Default,
      TokenService.Default,
      AccountVerificationService.Default,
      EmailService.Default,
      ConfigService.Default,
    ],
  },
) {}
