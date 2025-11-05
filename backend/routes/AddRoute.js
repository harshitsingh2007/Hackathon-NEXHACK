import express from "express";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { protect } from "../Controller/controller.js";
import User from "../models/userModels.js";

dotenv.config();
const router = express.Router();

// ✅ Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

/* ========================================================
   🎯 ROUTE 1: Ask AI-Personalized Interview Questions
   ======================================================== */
router.post("/ask_question", protect, async (req, res) => {
  console.log('Data is sent')
  try {
    const user = req.user; // retrieved from JWT middleware
    const numQuestions = parseInt(req.body.numQuestions) || 5;

    // 🧠 Build student info for personalization
    const studentInfo = `
    Name: ${user.name}
    College: ${user.college}
    Branch: ${user.branch}
    Year: ${user.year}
    Preparing For: ${user.preparingFor}
    Strengths: ${user.strengths}
    Weaknesses: ${user.weaknesses}
    Interests: ${user.interests?.join(", ")}
    Skills: ${user.skills?.join(", ")}
    Languages: ${user.languages?.join(", ")}
    `;

    const prompt = `
    You are an expert technical interviewer.
    Based on this student's information:
    ${studentInfo}
    Generate ${numQuestions} unique and domain-relevant interview questions.hey and ask some random question not repeated every time question
    Return only valid JSON in this format:
    {
      "questions": [
        "Question 1",
        "Question 2",
        ...
      ]
    }`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // 🧩 Extract & Parse JSON from Gemini response
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      return res
        .status(500)
        .json({ error: "Could not find valid JSON in Gemini response." });
    }

    let parsed;
    try {
      parsed = JSON.parse(match[0]);
    } catch (err) {
      console.error("JSON Parse Error:", err);
      parsed = { questions: [text] };
    }

    res.status(200).json({
      success: true,
      questions: parsed.questions || [],
    });
  } catch (error) {
    console.error("Error in /ask_question:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/generate_quiz", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('quizResults overallStats name weaknesses strengths interests skills');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    const { topic, difficulty: requestedDifficulty, num_questions = 10 } = req.body;
    
    // Analyze user's performance history
    const quizResults = user.quizResults || [];
    const recentQuizzes = quizResults.slice(-10); // Last 10 quizzes
    
    // Calculate adaptive difficulty based on performance
    let adaptiveDifficulty = requestedDifficulty || "medium";
    if (recentQuizzes.length > 0) {
      const avgRecentScore = recentQuizzes.reduce((sum, q) => sum + q.percentage, 0) / recentQuizzes.length;
      if (avgRecentScore >= 85) {
        adaptiveDifficulty = "hard";
      } else if (avgRecentScore >= 70) {
        adaptiveDifficulty = "medium";
      } else {
        adaptiveDifficulty = "easy";
      }
    }

    // Determine topic based on weak areas or user preference
    let selectedTopic = topic || "DSA";
    if (!topic && user.weaknesses) {
      // Suggest topic based on weaknesses
      const weaknessLower = user.weaknesses.toLowerCase();
      if (weaknessLower.includes("javascript") || weaknessLower.includes("js")) {
        selectedTopic = "JavaScript";
      } else if (weaknessLower.includes("python")) {
        selectedTopic = "Python";
      } else if (weaknessLower.includes("react")) {
        selectedTopic = "React";
      } else if (weaknessLower.includes("algorithm") || weaknessLower.includes("dsa")) {
        selectedTopic = "DSA";
      }
    }

    // Get topics user has already attempted to avoid repetition
    const attemptedTopics = [...new Set(quizResults.map(q => q.topic?.toLowerCase() || ''))];
    
    // Build performance context
    const performanceContext = recentQuizzes.length > 0
      ? `User's recent performance: Average score ${Math.round(recentQuizzes.reduce((s, q) => s + q.percentage, 0) / recentQuizzes.length)}%. `
      : "User is new to quizzes. ";
    
    const userContext = `
    User Profile:
    - Strengths: ${user.strengths || "Not specified"}
    - Weaknesses: ${user.weaknesses || "Not specified"}
    - Skills: ${user.skills?.join(", ") || "Not specified"}
    - Interests: ${user.interests?.join(", ") || "Not specified"}
    `;

    const prompt = `
    You are an advanced adaptive quiz generation AI that creates personalized, progressive quizzes.
    
    ${userContext}
    
    ${performanceContext}
    
    IMPORTANT REQUIREMENTS:
    1. Generate ${num_questions} to 15 COMPLETELY NEW and UNIQUE questions on "${selectedTopic}"
    2. Questions should be ${adaptiveDifficulty} difficulty level, matching the user's current ability
    3. DO NOT repeat any questions the user has likely seen before
    4. Make questions progressively more challenging within the quiz
    5. Focus on areas where the user might need improvement based on their profile
    6. Include diverse question types: conceptual, practical, problem-solving
    7. Each question should be unique and test different aspects of ${selectedTopic}
    8. Topics already attempted by user: ${attemptedTopics.join(", ") || "None"}
    
    Each question must include:
    - "id": a unique number (1, 2, 3...)
    - "question": the question text (must be unique and never seen before)
    - "options": a list of exactly 4 options (A, B, C, D format)
    - "answer": the correct option (only 'a', 'b', 'c', or 'd')
    - "explanation": a clear explanation (1–2 lines)
    - "difficulty": "${adaptiveDifficulty}"
    - "topic": "Specific subtopic of ${selectedTopic}"

    Respond ONLY in valid JSON format like this:
    {
      "quiz": [
        {
          "id": 1,
          "topic": "Specific subtopic",
          "difficulty": "${adaptiveDifficulty}",
          "question": "Unique question text that tests deep understanding?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "answer": "a",
          "explanation": "Clear explanation here."
        },
        ...
      ]
    }
    
    Generate questions that are fresh, challenging, and help the user grow. Avoid basic repetitive questions.
    `;

    const result = await model.generateContent(prompt);
    let outputText = result.response.text().trim();

    // 🧹 Clean and extract JSON from Gemini response
    outputText = outputText.replace(/```json|```/g, "").trim();

    let quizData;
    try {
      quizData = JSON.parse(outputText);
    } catch (err) {
      console.error("⚠️ JSON Parse Error:", err);
      quizData = { raw_text: outputText };
    }

    res.status(200).json({
      success: true,
      data: quizData,
    });
  } catch (error) {
    console.error("❌ Error in /generate_quiz:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/* ========================================================
   🎯 ROUTE 2: Evaluate Candidate's Answer
   ======================================================== */
router.post("/evaluate", protect, async (req, res) => {
  // Accept either legacy array of answers, or structured object with qa + metrics
  const payload = req.body?.data;
  // Normalize into a consistent object
  let normalized = { qa: [], meta: {} };
  try {
    if (Array.isArray(payload)) {
      // Legacy: just answers, no questions or metrics
      normalized.qa = payload.map((answer, idx) => ({ index: idx + 1, question: `Q${idx + 1}`, answer }));
    } else if (payload && typeof payload === "object") {
      // Expected new format
      const qaArray = Array.isArray(payload.qa) ? payload.qa : [];
      normalized.qa = qaArray.map((item, idx) => ({
        index: idx + 1,
        question: item.question || `Q${idx + 1}`,
        answer: item.answer || "",
        metrics: {
          avgVolume: Number(item.avgVolume ?? 0),
          wordsPerMinute: Number(item.wordsPerMinute ?? 0),
          pauseCount: Number(item.pauseCount ?? 0),
          speakingDurationSec: Number(item.speakingDurationSec ?? 0)
        }
      }));
      normalized.meta = payload.meta || {};
    }
  } catch (e) {
    // Fallback to raw
    normalized = { raw: payload };
  }

  const qaText = normalized.qa
    .map((q) => `Question: ${q.question}\nAnswer: ${q.answer}\nMetrics: ${JSON.stringify(q.metrics || {})}`)
    .join("\n\n");

  const prompt = `
  You are an expert technical interview evaluator and voice coach.
  Evaluate the candidate across content quality and vocal delivery.

  Here are the question-answer pairs with optional vocal metrics (avgVolume: 0-100 approx loudness, wordsPerMinute, pauseCount, speakingDurationSec):
  ---
  ${qaText}
  ---

  Return STRICT JSON with this schema:
  {
    "overall": {
      "confidence": number,            // 0-10
      "vocal_expression": number,      // 0-10 (intonation, pace, energy, volume control)
      "clarity": number,               // 0-10
      "grammar": number,               // 0-10
      "relevance": number,             // 0-10
      "summary": string                // concise 2-3 lines
    },
    "per_question": [
      {
        "index": number,
        "score": number,               // 0-10 content quality
        "answer_summary": string,
        "strengths": [string],
        "improvements": [string]
      }
    ],
    "recommendations": [string]        // actionable vocal + content tips
  }

  Only output JSON, no backticks or commentary.
  `;

  try {
    const result = await model.generateContent(prompt);
    let text = result.response.text().trim().replace(/```json|```/g, "");

    let evaluation;
    try {
      evaluation = JSON.parse(text);
    } catch (e) {
      evaluation = { raw_output: text };
    }

    // Save interview results to database
    try {
      const user = await User.findById(req.user.id);
      if (user) {
        const interviewResult = {
          questions: normalized.qa.map(q => ({
            question: q.question,
            answer: q.answer,
            metrics: q.metrics || {}
          })),
          evaluation: evaluation,
          dateTaken: new Date()
        };
        
        user.interviewResults.push(interviewResult);
        
        // Update overall stats
        if (evaluation.overall) {
          user.overallStats.totalInterviews = (user.overallStats.totalInterviews || 0) + 1;
          
          // Calculate average confidence and vocal expression
          const allInterviews = user.interviewResults || [];
          if (allInterviews.length > 0) {
            const totalConfidence = allInterviews.reduce((sum, ir) => 
              sum + (ir.evaluation?.overall?.confidence || 0), 0);
            const totalVocal = allInterviews.reduce((sum, ir) => 
              sum + (ir.evaluation?.overall?.vocal_expression || 0), 0);
            
            user.overallStats.averageConfidence = Math.round(totalConfidence / allInterviews.length);
            user.overallStats.averageVocalExpression = Math.round(totalVocal / allInterviews.length);
          }
        }
        
        await user.save();
      }
    } catch (saveError) {
      console.error("Error saving interview results:", saveError);
      // Don't fail the request if save fails
    }

    res.status(200).json({ success: true, evaluation });
  } catch (error) {
    console.error("Error in /evaluate:", error);
    res.status(500).json({ error: error.message });
  }
});

/* ========================================================
   🎯 ROUTE 3: Recommend YouTube Courses
   ======================================================== */
router.post("/recommend_courses", protect, async (req, res) => {
  console.log('Course recommendation requested');
  const userQuery =
    req.body.query ||
    "Recommend beginner-friendly JavaScript courses on YouTube.";

  const prompt = `
  You are a YouTube course recommender AI.
  Based on this query:
  "${userQuery}"
  Recommend 10–15 high-quality YouTube courses or playlists.
  Return clean JSON like this:
  {
    "recommendations": [
      {
        "title": "Course Title",
        "channel": "Channel Name",
        "playlist": true,
        "url": "https://youtube.com/..."
      }
    ]
  }`;

  try {
    const result = await model.generateContent(prompt);
    let text = result.response.text().replace(/```json|```/g, "").trim();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw_output: text };
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Error in /recommend_courses:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
