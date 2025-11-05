// models/User.js
import mongoose from "mongoose";

const quizResultSchema = new mongoose.Schema({
  topic: { type: String, required: true },
  difficulty: { type: String, required: true },
  totalQuestions: { type: Number, required: true },
  correctAnswers: { type: Number, required: true },
  wrongAnswers: { type: Number, required: true },
  score: { type: Number, required: true },
  percentage: { type: Number, required: true },
  timeTaken: { type: Number, required: true },
  dateTaken: { type: Date, default: Date.now },
  answers: [{
    question: String,
    selectedOption: String,
    correctOption: String,
    isCorrect: Boolean
  }]
});

const interviewResultSchema = new mongoose.Schema({
  questions: [{
    question: String,
    answer: String,
    metrics: {
      avgVolume: Number,
      wordsPerMinute: Number,
      pauseCount: Number,
      speakingDurationSec: Number
    }
  }],
  evaluation: {
    overall: {
      confidence: Number,
      vocal_expression: Number,
      clarity: Number,
      grammar: Number,
      relevance: Number,
      summary: String
    },
    per_question: [{
      index: Number,
      score: Number,
      answer_summary: String,
      strengths: [String],
      improvements: [String]
    }],
    recommendations: [String]
  },
  dateTaken: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  college: String,
  branch: String,
  year: String,
  preparingFor: String,
  strengths: String,
  weaknesses: String,
  interests: [String],
  skills: [String],
  languages: [String],
  quizResults: [quizResultSchema],
  interviewResults: [interviewResultSchema],
  overallStats: {
    totalQuizzes: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    bestScore: { type: Number, default: 0 },
    totalQuestionsAttempted: { type: Number, default: 0 },
    totalCorrectAnswers: { type: Number, default: 0 },
    totalInterviews: { type: Number, default: 0 },
    averageConfidence: { type: Number, default: 0 },
    averageVocalExpression: { type: Number, default: 0 }
  }
});

const User = mongoose.model("User", userSchema);
export default User;