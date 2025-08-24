import { Effect } from "effect";
import { FileSystem as FS } from "@effect/platform";

export const renderTemplate = (
  templatePath: string,
  values: Record<string, string>,
) =>
  Effect.gen(function* () {
    const fs = yield* FS.FileSystem;

    let template = yield* fs.readFileString(templatePath, "utf8");

    if (values.style) {
      template = template.replace("/* {{style}} */", values.style);
    }

    for (const [key, value] of Object.entries(values)) {
      if (key !== "style") {
        template = template.replace(new RegExp(`{{${key}}}`, "g"), value);
      }
    }

    return template;
  });
