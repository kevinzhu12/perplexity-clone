"use server";

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function getChatCompletion(message: string) {
  try {
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: message },
      ],
      model: "gpt-4o-mini",
    });

    return completion.choices[0].message;
  } catch (error) {
    console.error("Error in OpenAI chat completion:", error);
    throw error;
  }
}
