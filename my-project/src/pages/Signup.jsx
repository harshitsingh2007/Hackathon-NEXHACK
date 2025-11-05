import { useState } from "react";
import useAuthStore from "../store/userAuthStore.js";
import { useNavigate } from "react-router-dom";
import "./Signup.css"; // 👈 Import external CSS

export default function Signup() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    college: "",
    branch: "",
    year: "",
    preparingFor: "",
    strengths: "",
    weaknesses: "",
    interests: [],
    skills: [],
    languages: [],
  });

  const [tempInterest, setTempInterest] = useState("");
  const [tempSkill, setTempSkill] = useState("");
  const [tempLanguage, setTempLanguage] = useState("");

  const { signup, loading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const addItem = (key, value, setter) => {
    if (value.trim() !== "") {
      setFormData({ ...formData, [key]: [...formData[key], value.trim()] });
      setter("");
    }
  };

  const removeItem = (key, index) => {
    setFormData({
      ...formData,
      [key]: formData[key].filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await signup(formData);
    if (res?.success) navigate("/login");
  };

  return (
    <div className="signup-container">
      <form onSubmit={handleSubmit} className="signup-card">
        <h2>Create Your Profile 🧠</h2>
        <p className="subtitle">Build your personalized AI interview experience</p>

        {/* Basic Info */}
        <input
          name="name"
          type="text"
          placeholder="Full Name"
          onChange={handleChange}
          required
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          onChange={handleChange}
          required
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          onChange={handleChange}
          required
        />
        <input
          name="college"
          type="text"
          placeholder="College"
          onChange={handleChange}
        />
        <input
          name="branch"
          type="text"
          placeholder="Branch"
          onChange={handleChange}
        />
        <input
          name="year"
          type="text"
          placeholder="Year (e.g. 3rd)"
          onChange={handleChange}
        />
        <input
          name="preparingFor"
          type="text"
          placeholder="Preparing for (e.g. Placements, GATE)"
          onChange={handleChange}
        />
        <input
          name="strengths"
          type="text"
          placeholder="Your Strengths"
          onChange={handleChange}
        />
        <input
          name="weaknesses"
          type="text"
          placeholder="Your Weaknesses"
          onChange={handleChange}
        />

        {/* Interests */}
        <div className="input-group">
          <label>Interests</label>
          <div className="array-input">
            <input
              value={tempInterest}
              onChange={(e) => setTempInterest(e.target.value)}
              placeholder="Add interest..."
            />
            <button
              type="button"
              onClick={() => addItem("interests", tempInterest, setTempInterest)}
            >
              Add
            </button>
          </div>
          <div className="chip-container">
            {formData.interests.map((item, i) => (
              <span key={i} className="chip">
                {item}
                <button type="button" onClick={() => removeItem("interests", i)}>
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Skills */}
        <div className="input-group">
          <label>Skills</label>
          <div className="array-input">
            <input
              value={tempSkill}
              onChange={(e) => setTempSkill(e.target.value)}
              placeholder="Add skill..."
            />
            <button
              type="button"
              onClick={() => addItem("skills", tempSkill, setTempSkill)}
            >
              Add
            </button>
          </div>
          <div className="chip-container">
            {formData.skills.map((item, i) => (
              <span key={i} className="chip">
                {item}
                <button type="button" onClick={() => removeItem("skills", i)}>
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Languages */}
        <div className="input-group">
          <label>Languages</label>
          <div className="array-input">
            <input
              value={tempLanguage}
              onChange={(e) => setTempLanguage(e.target.value)}
              placeholder="Add language..."
            />
            <button
              type="button"
              onClick={() =>
                addItem("languages", tempLanguage, setTempLanguage)
              }
            >
              Add
            </button>
          </div>
          <div className="chip-container">
            {formData.languages.map((item, i) => (
              <span key={i} className="chip">
                {item}
                <button
                  type="button"
                  onClick={() => removeItem("languages", i)}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {error && <p className="error">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="submit-btn"
        >
          {loading ? "Creating..." : "Sign Up"}
        </button>

        <p className="login-link">
          Already have an account?{" "}
          <a href="/login">Login</a>
        </p>
      </form>
    </div>
  );
}
