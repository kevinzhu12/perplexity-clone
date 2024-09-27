"use server";

import Exa from "exa-js";

export async function searchExaContents(query: string) {
  const exa = new Exa("38774120-ab14-44c7-8454-53aa47b59468");

  const result = await exa.searchAndContents(query, {
    type: "neural",
    useAutoprompt: true,
    numResults: 10,
    text: true,
  });

  return result;
}
