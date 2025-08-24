import { Schema as S } from "effect";
import { ObjectId } from "mongodb";
import { AccountId } from "./account.js";

export const AccountBlockId = S.instanceOf(ObjectId)
  .pipe(S.brand("AccountBlockId"))
  .annotations({
    jsonSchema: { type: "string" },
  });

export type AccountBlockId = typeof AccountBlockId.Type;

export const AccountBlock = S.Struct({
  id: AccountBlockId,
  blockerAccountId: AccountId,
  blockedAccountId: AccountId,
  isDeleted: S.Boolean,
  createdAt: S.Date,
  updatedAt: S.Date,
});

export type AccountBlockType = S.Schema.Type<typeof AccountBlock>;
