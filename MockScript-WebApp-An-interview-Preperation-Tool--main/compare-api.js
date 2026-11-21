require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

function parseGeminiJson(text) {
    const cleaned = text
        .trim()
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "");

    return JSON.parse(cleaned);
}

async function compare(expectedAnswers, userAnswers) {
    const result = expectedAnswers.map((expectedAnswer, index) => {
        const userAnswer = userAnswers[index] || "";

        return {
            expectedAnswer,
            userAnswer,
            similarity: null,
            feedback: "Not Attempted",
            status: "Not Attempted"
        };
    });

    const attempted = [];

    for (let i = 0; i < expectedAnswers.length; i++) {
        if (userAnswers[i] && userAnswers[i].trim()) {
            attempted.push({
                index: i,
                expectedAnswer: expectedAnswers[i],
                userAnswer: userAnswers[i]
            });
        }
    }

    if (attempted.length === 0) {
        return result;
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3.5-flash-lite",
            contents: `
You are a technical interview evaluator.

Evaluate each user's answer against its expected answer.

Consider:
1. Technical correctness
2. Important concepts covered
3. Relevance
4. Clarity

Give each answer a score from 0 to 100.
Give short, helpful feedback.
Keep the original index for every result.

Data:
${JSON.stringify(attempted)}

Return ONLY valid JSON in this format:
{
  "results": [
    {
      "index": 0,
      "score": 85,
      "feedback": "Good answer. Explain the concept with an example."
    }
  ]
}
`
        });

        const parsed = parseGeminiJson(response.text);

        if (!Array.isArray(parsed.results)) {
            throw new Error("Invalid evaluation response from Gemini");
        }

        for (const item of parsed.results) {
            const index = Number(item.index);

            if (!Number.isInteger(index) ||
                index < 0 ||
                index >= result.length ||
                !attempted.some(answer => answer.index === index)) {
                continue;
            }

            result[index].similarity = Math.max(
                0,
                Math.min(100, Number(item.score) || 0)
            );

            result[index].feedback =
                item.feedback || "No feedback available";

            result[index].status = "Compared";
        }

        return result;

    } catch (error) {
        console.error("Gemini Comparison Error:", error.message);

        for (const item of attempted) {
            result[item.index].similarity = null;
            result[item.index].feedback = "Evaluation failed";
            result[item.index].status = "Comparison Failed";
        }

        return result;
    }
}

module.exports = compare;