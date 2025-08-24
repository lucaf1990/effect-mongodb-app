import { Layer } from "effect";
import { AccountRepository } from "../Account/repositories/accountRepository.js";
import { AccountService } from "../Account/services/accountService.js";
import { DatabaseService } from "./db.js";

export const AppLayer = Layer.mergeAll(
  DatabaseService.Default,
  AccountRepository.Default,
  AccountService.Default,
);
