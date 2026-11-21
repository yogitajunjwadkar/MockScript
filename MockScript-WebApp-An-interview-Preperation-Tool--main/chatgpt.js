
require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

async function test(questions) {
    if (!Array.isArray(questions) || questions.length === 0) {
        return [];
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3.5-flash-lite",
            contents: `
You are an expert technical interview coach.

Generate one correct, simple and concise interview answer for each question.
Keep each answer within 100 words.
Maintain the exact same order as the questions.

Return ONLY valid JSON in this format:
{
  "answers": [
    "Answer 1",
    "Answer 2"
  ]
}

Questions:
${JSON.stringify(questions)}
`
        });

        let rawText = response.text;

        if (!rawText || !rawText.trim()) {
            throw new Error("Gemini returned an empty response");
        }

        // Remove Markdown code fences if Gemini adds them
        rawText = rawText
            .trim()
            .replace(/^```(?:json)?\s*/i, "")
            .replace(/\s*```$/, "");

        const result = JSON.parse(rawText);

        if (!Array.isArray(result.answers) ||
            result.answers.length !== questions.length) {
            throw new Error("Invalid number of generated answers");
        }

        console.log("All expected answers generated successfully.");

        return result.answers;

    } catch (error) {
        console.error("Gemini Answer Generation Error:", error.message);
        throw error;
    }
}

module.exports = test;
