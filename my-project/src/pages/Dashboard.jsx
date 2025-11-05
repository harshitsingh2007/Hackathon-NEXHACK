import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Link, useLocation } from "react-router-dom";
import "./Dashboard.css";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const token = localStorage.getItem("token");
        
        // Fetch user data and dashboard stats in parallel
        const [userRes, statsRes] = await Promise.all([
          fetch("http://localhost:5000/api/auth/me", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch("http://localhost:5000/api/auth/dashboard/stats", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
        ]);

        const userData = await userRes.json();
        const statsData = await statsRes.json();

        if (userData.success) {
          setUser(userData.user);
        }
        
        if (statsData.success) {
          setDashboardStats(statsData.stats);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-loading" style={{ 
        padding: "50px", 
        textAlign: "center", 
        background: "#0f172a", 
        minHeight: "100vh", 
        color: "#e2e8f0" 
      }}>
        Loading dashboard...
      </div>
    );
  }

  // Use real stats from API or defaults
  const stats = dashboardStats || {
    totalQuizzes: 0,
    averageScore: 0,
    bestScore: 0,
    chartData: [],
    recentQuizzes: []
  };

  // Use chart data from API or empty array
  const chartData = stats.chartData && stats.chartData.length > 0 
    ? stats.chartData 
    : [{ name: "No Data", quizzes: 0, avgScore: 0 }];

  // Get interview sessions count from user stats
  const interviewSessions = user?.overallStats?.totalInterviews || 0;

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>EduNerve AI</h2>
          <p>Intelligent Learning</p>
        </div>
        <nav>
          <Link to="/dashboard" className={location.pathname === "/dashboard" ? "active" : ""}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Dashboard
          </Link>
          <Link to="/course" className={location.pathname === "/course" ? "active" : ""}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Learning
          </Link>
          <Link to="/quiz" className={location.pathname === "/quiz" ? "active" : ""}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Quiz
          </Link>
          <Link to="/interview" className={location.pathname === "/interview" ? "active" : ""}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            Interview Prep
          </Link>
          <Link to="/analytics" className={location.pathname === "/analytics" ? "active" : ""}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Analytics
          </Link>
        </nav>
        <div className="sidebar-footer">
          <p>{user?.name || "Student"}</p>
          <Link to="/profile">View Profile</Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <h1>
          Welcome back, {user?.name?.split(" ")[0] || "Student"}! 👋
        </h1>
        <p className="subtext">Continue your learning journey</p>

        {/* Stats Cards */}
        <div className="stats-cards">
          <div className="card purple">
            <h3>{stats.recentQuizzes?.length || 0}</h3>
            <p>Recent Activities</p>
          </div>
          <div className="card green">
            <h3>{stats.totalQuizzes || 0}</h3>
            <p>Quizzes Completed</p>
          </div>
          <div className="card pink">
            <h3>{interviewSessions}</h3>
            <p>Interview Sessions</p>
          </div>
          <div className="card blue">
            <h3>{stats.averageScore || 0}%</h3>
            <p>Avg Performance</p>
          </div>
        </div>

        {/* Learning Progress */}
        <section className="learning-section">
          <h2>Recent Quiz Performance</h2>
          <div className="learning-card">
            {stats.recentQuizzes && stats.recentQuizzes.length > 0 ? (
              stats.recentQuizzes.slice(0, 3).map((quiz, index) => (
                <div key={index} className="course">
                  <h3>{quiz.topic || `Quiz ${index + 1}`}</h3>
                  <p>
                    Score: {quiz.percentage}% | 
                    {quiz.correctAnswers}/{quiz.totalQuestions} Correct | 
                    {new Date(quiz.dateTaken).toLocaleDateString()}
                  </p>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${quiz.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              <div className="course">
                <h3>No quizzes completed yet</h3>
                <p>Start taking quizzes to see your progress here</p>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: "0%" }}></div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Chart + Achievements */}
        <div className="bottom-section">
          <div className="chart-section">
            <h2>Performance Overview</h2>
            {chartData.length > 0 && chartData[0].name !== "No Data" ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ 
                      background: "#1e293b", 
                      border: "1px solid rgba(59, 130, 246, 0.3)",
                      borderRadius: "8px",
                      color: "#e2e8f0"
                    }}
                  />
                  <Bar dataKey="avgScore" fill="#8884d8" name="Avg Score (%)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ 
                padding: "40px", 
                textAlign: "center", 
                color: "#94a3b8" 
              }}>
                <p>No quiz data available yet</p>
                <p style={{ fontSize: "0.9rem", marginTop: "8px" }}>
                  Complete quizzes to see your performance chart
                </p>
              </div>
            )}
          </div>

          <div className="achievements-section">
            <h2>Recent Achievements</h2>
            <ul>
              {stats.totalQuizzes >= 10 && (
                <li>🏆 Quiz Master — Completed {stats.totalQuizzes} quizzes</li>
              )}
              {stats.bestScore >= 90 && (
                <li>⭐ Excellent Performer — Achieved {stats.bestScore}% best score</li>
              )}
              {stats.averageScore >= 80 && (
                <li>📈 Consistent Learner — Maintaining {stats.averageScore}% average</li>
              )}
              {stats.totalQuizzes === 0 && (
                <li>🎯 Get Started — Complete your first quiz to unlock achievements!</li>
              )}
            </ul>

            <div className="interview-prep">
              <h3>Next Interview Prep</h3>
              <p>Practice technical questions to ace your next interview</p>
              <Link to="/interview" className="start-btn">Start Practice</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
