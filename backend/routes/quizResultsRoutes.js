// routes/quizResultsRoutes.js
import express from 'express';
import User from '../models/userModels.js';
import {protect} from '../Controller/controller.js';

const router = express.Router();

// Save quiz results
router.post('/save-result', protect, async (req, res) => {
  try {
    const {
      topic,
      difficulty,
      totalQuestions,
      correctAnswers,
      wrongAnswers,
      score,
      percentage,
      timeTaken,
      answers
    } = req.body;

    const quizResult = {
      topic,
      difficulty,
      totalQuestions,
      correctAnswers,
      wrongAnswers,
      score,
      percentage,
      timeTaken,
      answers,
      dateTaken: new Date()
    };

    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Add new quiz result
    user.quizResults.push(quizResult);
    
    // Update overall stats
    user.overallStats.totalQuizzes += 1;
    user.overallStats.totalQuestionsAttempted += totalQuestions;
    user.overallStats.totalCorrectAnswers += correctAnswers;
    user.overallStats.averageScore = 
      (user.overallStats.totalCorrectAnswers / user.overallStats.totalQuestionsAttempted) * 100;
    user.overallStats.bestScore = Math.max(user.overallStats.bestScore, percentage);

    await user.save();

    res.json({
      success: true,
      message: 'Quiz results saved successfully',
      overallStats: user.overallStats
    });
  } catch (error) {
    console.error('Error saving quiz results:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save quiz results'
    });
  }
});

// Get user's quiz history
router.get('/history', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('quizResults overallStats');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      quizResults: user.quizResults,
      overallStats: user.overallStats
    });
  } catch (error) {
    console.error('Error fetching quiz history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz history'
    });
  }
});

// Get user's overall statistics
router.get('/stats', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('overallStats');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      stats: user.overallStats
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user statistics'
    });
  }
});

export default router;