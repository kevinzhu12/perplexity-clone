"use server";

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function getChatCompletion(message: string) {
  try {
    console.log("Starting OpenAI chat completion");
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: message },
      ],
      model: "gpt-3.5-turbo",
    });

    console.log("OpenAI chat completion successful");
    return completion.choices[0].message;
  } catch (error) {
    console.error("Error in OpenAI chat completion:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    // Instead of throwing, return an error object
    return { error: "Failed to generate completion. Please try again." };
  }
}
