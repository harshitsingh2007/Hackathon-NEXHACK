import express from "express";
import { loginUser, registerUser } from "../Controller/controller.js";
import { protect } from "../Controller/controller.js"; // only for protected routes
import User from "../models/userModels.js";

const router = express.Router();

// Public routes
router.post("/signup", registerUser); // no protect
router.post("/login", loginUser);     // no protect


router.get("/me", protect, async (req, res) => {
  try {
    const user = req.user; // already fetched by protect middleware
    res.json({ success: true, user });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Server error fetching user profile" });
  }
});

// Get dashboard statistics
router.get("/dashboard/stats", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('quizResults overallStats');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Calculate stats from quiz results
    const quizResults = user.quizResults || [];
    const totalQuizzes = quizResults.length;
    
    // Calculate average score from quiz results
    const averageScore = totalQuizzes > 0
      ? Math.round(quizResults.reduce((sum, q) => sum + q.percentage, 0) / totalQuizzes)
      : 0;

    // Get best score
    const bestScore = totalQuizzes > 0
      ? Math.max(...quizResults.map(q => q.percentage))
      : 0;

    // Calculate performance by topic
    const topicStats = {};
    quizResults.forEach(quiz => {
      const topic = quiz.topic || 'General';
      if (!topicStats[topic]) {
        topicStats[topic] = {
          quizzes: 0,
          totalScore: 0,
          avgScore: 0
        };
      }
      topicStats[topic].quizzes += 1;
      topicStats[topic].totalScore += quiz.percentage;
      topicStats[topic].avgScore = Math.round(topicStats[topic].totalScore / topicStats[topic].quizzes);
    });

    // Convert to array format for chart
    const chartData = Object.entries(topicStats).map(([name, stats]) => ({
      name: name,
      quizzes: stats.quizzes,
      avgScore: stats.avgScore
    }));

    // Get recent quiz results (last 5)
    const recentQuizzes = quizResults
      .sort((a, b) => new Date(b.dateTaken) - new Date(a.dateTaken))
      .slice(0, 5);

    res.json({
      success: true,
      stats: {
        totalQuizzes,
        averageScore,
        bestScore,
        totalQuestionsAttempted: user.overallStats?.totalQuestionsAttempted || 0,
        totalCorrectAnswers: user.overallStats?.totalCorrectAnswers || 0,
        chartData,
        recentQuizzes
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics'
    });
  }
});

// Get comprehensive analytics data
router.get("/analytics", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('quizResults interviewResults overallStats');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const quizResults = user.quizResults || [];
    const interviewResults = user.interviewResults || [];

    // Quiz Performance Over Time
    const quizPerformanceOverTime = quizResults
      .sort((a, b) => new Date(a.dateTaken) - new Date(b.dateTaken))
      .map((quiz, index) => ({
        date: new Date(quiz.dateTaken).toLocaleDateString(),
        score: quiz.percentage,
        topic: quiz.topic,
        attempt: index + 1
      }));

    // Performance by Topic (Quiz)
    const topicPerformance = {};
    quizResults.forEach(quiz => {
      const topic = quiz.topic || 'General';
      if (!topicPerformance[topic]) {
        topicPerformance[topic] = {
          totalQuizzes: 0,
          totalScore: 0,
          scores: []
        };
      }
      topicPerformance[topic].totalQuizzes += 1;
      topicPerformance[topic].totalScore += quiz.percentage;
      topicPerformance[topic].scores.push(quiz.percentage);
    });

    const topicChartData = Object.entries(topicPerformance).map(([name, data]) => ({
      name: name,
      quizzes: data.totalQuizzes,
      avgScore: Math.round(data.totalScore / data.totalQuizzes),
      bestScore: Math.max(...data.scores),
      worstScore: Math.min(...data.scores)
    }));

    // Interview Performance Over Time
    const interviewPerformanceOverTime = interviewResults
      .sort((a, b) => new Date(a.dateTaken) - new Date(b.dateTaken))
      .map((interview, index) => ({
        date: new Date(interview.dateTaken).toLocaleDateString(),
        confidence: interview.evaluation?.overall?.confidence || 0,
        vocalExpression: interview.evaluation?.overall?.vocal_expression || 0,
        clarity: interview.evaluation?.overall?.clarity || 0,
        overallScore: interview.evaluation?.overall ? 
          Math.round((interview.evaluation.overall.confidence + 
                      interview.evaluation.overall.vocal_expression + 
                      interview.evaluation.overall.clarity + 
                      interview.evaluation.overall.grammar + 
                      interview.evaluation.overall.relevance) / 5) : 0,
        attempt: index + 1
      }));

    // Interview Skills Breakdown
    const interviewSkillsData = interviewResults.length > 0 ? {
      confidence: interviewResults.reduce((sum, i) => sum + (i.evaluation?.overall?.confidence || 0), 0) / interviewResults.length,
      vocalExpression: interviewResults.reduce((sum, i) => sum + (i.evaluation?.overall?.vocal_expression || 0), 0) / interviewResults.length,
      clarity: interviewResults.reduce((sum, i) => sum + (i.evaluation?.overall?.clarity || 0), 0) / interviewResults.length,
      grammar: interviewResults.reduce((sum, i) => sum + (i.evaluation?.overall?.grammar || 0), 0) / interviewResults.length,
      relevance: interviewResults.reduce((sum, i) => sum + (i.evaluation?.overall?.relevance || 0), 0) / interviewResults.length,
    } : null;

    // Difficulty Distribution
    const difficultyDistribution = {};
    quizResults.forEach(quiz => {
      const diff = quiz.difficulty || 'medium';
      difficultyDistribution[diff] = (difficultyDistribution[diff] || 0) + 1;
    });

    const difficultyChartData = Object.entries(difficultyDistribution).map(([name, count]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      count: count
    }));

    res.json({
      success: true,
      analytics: {
        quiz: {
          totalQuizzes: quizResults.length,
          averageScore: quizResults.length > 0 
            ? Math.round(quizResults.reduce((sum, q) => sum + q.percentage, 0) / quizResults.length)
            : 0,
          bestScore: quizResults.length > 0 
            ? Math.max(...quizResults.map(q => q.percentage))
            : 0,
          performanceOverTime: quizPerformanceOverTime,
          topicPerformance: topicChartData,
          difficultyDistribution: difficultyChartData
        },
        interview: {
          totalInterviews: interviewResults.length,
          averageConfidence: user.overallStats?.averageConfidence || 0,
          averageVocalExpression: user.overallStats?.averageVocalExpression || 0,
          performanceOverTime: interviewPerformanceOverTime,
          skillsBreakdown: interviewSkillsData,
          recentInterviews: interviewResults
            .sort((a, b) => new Date(b.dateTaken) - new Date(a.dateTaken))
            .slice(0, 5)
        },
        overall: {
          totalQuizzes: quizResults.length,
          totalInterviews: interviewResults.length,
          overallStats: user.overallStats
        }
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics data'
    });
  }
});

export default router;
