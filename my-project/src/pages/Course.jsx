import React, { useEffect, useState } from "react";
import axios from "axios";
import styles from "./Course.module.css";

const Course = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchCourses() {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("No token found. Please log in again.");
        setLoading(false);
        return;
      }

      const response = await axios.post(
        "http://localhost:5000/api/interview/recommend_courses",
        { query: "Top React.js courses for professional learners" },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const recommendations = response.data.data.recommendations || [];
      setCourses(recommendations);
    } catch (err) {
      console.error("Error fetching courses:", err.response?.data || err);
      setError("Failed to load courses. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCourses();
  }, []);

  if (loading)
    return <div className={styles.loader}>⏳ Loading personalized courses...</div>;

  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>🎓 Personalized Learning Dashboard</h1>
        <p>AI-picked YouTube courses based on your interests 🚀</p>
      </header>

      <div className={styles.grid}>
        {courses.map((course, index) => (
          <div key={index} className={styles.card}>
            <div className={styles.thumbnail}>
              <img
                src={`https://img.youtube.com/vi/${extractVideoId(course.url)}/0.jpg`}
                alt={course.title}
              />
              {course.playlist && <span className={styles.badge}>Playlist</span>}
            </div>

            <div className={styles.cardBody}>
              <h3 className={styles.title}>{course.title}</h3>
              <p className={styles.channel}>📺 {course.channel}</p>

              <div className={styles.actions}>
                <a
                  href={course.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.watchBtn}
                >
                  Watch Now
                </a>
                <button className={styles.learnBtn}>Start Learning →</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Helper: extract YouTube video ID
function extractVideoId(url) {
  const regExp =
    /(?:v=|\/)([0-9A-Za-z_-]{11})(?:[?&]|$)/;
  const match = url.match(regExp);
  return match ? match[1] : "dQw4w9WgXcQ"; // fallback thumbnail
}

export default Course;
