import { kvTable } from "npm:@tugboats/core";

const prefs = kvTable("preferences");

const userPrefs = async () => {
  const res = await prefs.get(["user"]);
  if (res._tag === "Ok" && res._type === "Item") {
    return res.result;
  } else {
    return "None";
  }
};

export async function userAliasesMap() {
  const up = await userPrefs();
  if (up == "None") return { "prefs": "prefs", "secrets": "secrets" };
  return {
    "prefs": "prefs",
    "secrets": "secrets",
  };
}
