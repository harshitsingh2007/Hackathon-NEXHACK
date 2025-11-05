import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Link, useLocation } from "react-router-dom";
import "./Dashboard.css";

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    async function fetchAnalyticsData() {
      try {
        const token = localStorage.getItem("token");
        
        const [userRes, analyticsRes] = await Promise.all([
          fetch("http://localhost:5000/api/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:5000/api/auth/analytics", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const userData = await userRes.json();
        const analyticsData = await analyticsRes.json();

        if (userData.success) setUser(userData.user);
        if (analyticsData.success) setAnalytics(analyticsData.analytics);
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalyticsData();
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
        Loading analytics...
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="dashboard-loading" style={{ 
        padding: "50px", 
        textAlign: "center", 
        background: "#0f172a", 
        minHeight: "100vh", 
        color: "#e2e8f0" 
      }}>
        No analytics data available
      </div>
    );
  }

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'];
  const INTERVIEW_COLORS = ['#60a5fa', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

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
        <h1>📊 Analytics & Insights</h1>
        <p className="subtext">Comprehensive analysis of your learning journey</p>

        {/* Quiz Analytics Section */}
        <section style={{ marginTop: "30px" }}>
          <h2 style={{ color: "#e2e8f0", marginBottom: "20px" }}>Quiz Performance</h2>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px", marginBottom: "30px" }}>
            <div className="card purple">
              <h3>{analytics.quiz.totalQuizzes}</h3>
              <p>Total Quizzes</p>
            </div>
            <div className="card blue">
              <h3>{analytics.quiz.averageScore}%</h3>
              <p>Average Score</p>
            </div>
            <div className="card green">
              <h3>{analytics.quiz.bestScore}%</h3>
              <p>Best Score</p>
            </div>
          </div>

          {/* Quiz Performance Over Time */}
          {analytics.quiz.performanceOverTime.length > 0 && (
            <div className="chart-section" style={{ marginBottom: "30px" }}>
              <h3 style={{ color: "#e2e8f0", marginBottom: "15px" }}>Quiz Performance Over Time</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.quiz.performanceOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="attempt" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ 
                      background: "#1e293b", 
                      border: "1px solid rgba(59, 130, 246, 0.3)",
                      borderRadius: "8px",
                      color: "#e2e8f0"
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="score" stroke="#8884d8" name="Score %" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Performance by Topic */}
          {analytics.quiz.topicPerformance.length > 0 && (
            <div className="chart-section" style={{ marginBottom: "30px" }}>
              <h3 style={{ color: "#e2e8f0", marginBottom: "15px" }}>Performance by Topic</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.quiz.topicPerformance}>
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
                  <Legend />
                  <Bar dataKey="avgScore" fill="#8884d8" name="Avg Score %" />
                  <Bar dataKey="bestScore" fill="#82ca9d" name="Best Score %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Difficulty Distribution */}
          {analytics.quiz.difficultyDistribution.length > 0 && (
            <div className="chart-section" style={{ marginBottom: "30px" }}>
              <h3 style={{ color: "#e2e8f0", marginBottom: "15px" }}>Quiz Difficulty Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.quiz.difficultyDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {analytics.quiz.difficultyDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      background: "#1e293b", 
                      border: "1px solid rgba(59, 130, 246, 0.3)",
                      borderRadius: "8px",
                      color: "#e2e8f0"
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        {/* Interview Analytics Section */}
        <section style={{ marginTop: "40px" }}>
          <h2 style={{ color: "#e2e8f0", marginBottom: "20px" }}>Interview Preparation Analysis</h2>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px", marginBottom: "30px" }}>
            <div className="card pink">
              <h3>{analytics.interview.totalInterviews}</h3>
              <p>Interview Sessions</p>
            </div>
            <div className="card blue">
              <h3>{Math.round(analytics.interview.averageConfidence)}/10</h3>
              <p>Avg Confidence</p>
            </div>
            <div className="card green">
              <h3>{Math.round(analytics.interview.averageVocalExpression)}/10</h3>
              <p>Avg Vocal Expression</p>
            </div>
          </div>

          {/* Interview Performance Over Time */}
          {analytics.interview.performanceOverTime.length > 0 && (
            <div className="chart-section" style={{ marginBottom: "30px" }}>
              <h3 style={{ color: "#e2e8f0", marginBottom: "15px" }}>Interview Performance Over Time</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.interview.performanceOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="attempt" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ 
                      background: "#1e293b", 
                      border: "1px solid rgba(59, 130, 246, 0.3)",
                      borderRadius: "8px",
                      color: "#e2e8f0"
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="confidence" stroke="#60a5fa" name="Confidence" strokeWidth={2} />
                  <Line type="monotone" dataKey="vocalExpression" stroke="#8b5cf6" name="Vocal Expression" strokeWidth={2} />
                  <Line type="monotone" dataKey="clarity" stroke="#ec4899" name="Clarity" strokeWidth={2} />
                  <Line type="monotone" dataKey="overallScore" stroke="#10b981" name="Overall Score" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Interview Skills Breakdown */}
          {analytics.interview.skillsBreakdown && (() => {
            const skillsData = [
              { name: "Confidence", value: Math.round(analytics.interview.skillsBreakdown.confidence * 10) / 10 },
              { name: "Vocal Expression", value: Math.round(analytics.interview.skillsBreakdown.vocalExpression * 10) / 10 },
              { name: "Clarity", value: Math.round(analytics.interview.skillsBreakdown.clarity * 10) / 10 },
              { name: "Grammar", value: Math.round(analytics.interview.skillsBreakdown.grammar * 10) / 10 },
              { name: "Relevance", value: Math.round(analytics.interview.skillsBreakdown.relevance * 10) / 10 },
            ];
            return (
              <div className="chart-section" style={{ marginBottom: "30px" }}>
                <h3 style={{ color: "#e2e8f0", marginBottom: "15px" }}>Interview Skills Breakdown</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={skillsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis domain={[0, 10]} stroke="#94a3b8" />
                    <Tooltip 
                      contentStyle={{ 
                        background: "#1e293b", 
                        border: "1px solid rgba(59, 130, 246, 0.3)",
                        borderRadius: "8px",
                        color: "#e2e8f0"
                      }}
                    />
                    <Bar dataKey="value" name="Score (0-10)">
                      {skillsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={INTERVIEW_COLORS[index % INTERVIEW_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            );
          })()}

          {/* Recent Interview Sessions */}
          {analytics.interview.recentInterviews.length > 0 && (
            <div className="chart-section">
              <h3 style={{ color: "#e2e8f0", marginBottom: "15px" }}>Recent Interview Sessions</h3>
              <div style={{ display: "grid", gap: "12px" }}>
                {analytics.interview.recentInterviews.map((interview, index) => (
                  <div 
                    key={index} 
                    style={{ 
                      background: "#1e293b", 
                      borderRadius: "12px", 
                      padding: "16px",
                      border: "1px solid rgba(59, 130, 246, 0.1)"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <strong style={{ color: "#e2e8f0" }}>Session {interview.evaluation?.overall ? analytics.interview.totalInterviews - index : index + 1}</strong>
                      <span style={{ color: "#94a3b8", fontSize: "0.9rem" }}>
                        {new Date(interview.dateTaken).toLocaleDateString()}
                      </span>
                    </div>
                    {interview.evaluation?.overall && (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "8px", marginTop: "8px" }}>
                        <div style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
                          Confidence: <span style={{ color: "#60a5fa" }}>{interview.evaluation.overall.confidence}/10</span>
                        </div>
                        <div style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
                          Vocal: <span style={{ color: "#8b5cf6" }}>{interview.evaluation.overall.vocal_expression}/10</span>
                        </div>
                        <div style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
                          Clarity: <span style={{ color: "#ec4899" }}>{interview.evaluation.overall.clarity}/10</span>
                        </div>
                        <div style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
                          Grammar: <span style={{ color: "#f59e0b" }}>{interview.evaluation.overall.grammar}/10</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

