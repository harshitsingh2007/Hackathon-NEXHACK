import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function InterviewApp() {
    const navigate=useNavigate()
  const callingUrl = "http://localhost:5000/api/interview/ask_question";
  const evaluateUrl = "http://localhost:5000/api/interview/evaluate";

  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [volume, setVolume] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [elapsedSec, setElapsedSec] = useState(0);

  const recognitionRef = useRef(null);
  const tempTranscript = useRef("");
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const dataArrayRef = useRef(null);
  const micStreamRef = useRef(null);
  const volumeSamplesRef = useRef([]);
  const pauseCountRef = useRef(0);
  const lastTranscriptLengthRef = useRef(0);

  // Fetch questions from API
  useEffect(() => {
    const fetchQuestions = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setErrorMsg("You must be logged in to access this resource.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(callingUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ domain: "CSE" }),
        });

        if (!response.ok) {
          if (response.status === 401) {
            setErrorMsg("Unauthorized. Please login again.");
          } else {
            setErrorMsg(`Error ${response.status}: ${response.statusText}`);
          }
          setLoading(false);
          return;
        }

        const data = await response.json();

        if (data.questions && Array.isArray(data.questions)) {
          setQuestions(data.questions);
        } else {
          setErrorMsg("Invalid response from server.");
        }
      } catch (err) {
        console.error("Error fetching questions:", err);
        setErrorMsg("Failed to load questions.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  // Start recording
  const startRecording = async () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech Recognition is not supported in this browser!");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);

      const checkVolume = () => {
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
        const avg =
          dataArrayRef.current.reduce((a, b) => a + b, 0) / bufferLength;
        setVolume(avg);
        volumeSamplesRef.current.push(avg);
        if (isRecording) requestAnimationFrame(checkVolume);
      };
      checkVolume();

      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = true;
      recognition.continuous = true;

      recognition.onstart = () => {
        tempTranscript.current = "";
        setTranscript("");
        setErrorMsg("");
        setIsRecording(true);
        setQuestionStartTime(Date.now());
        volumeSamplesRef.current = [];
        pauseCountRef.current = 0;
        lastTranscriptLengthRef.current = 0;
        // start simple timer
        let startedAt = Date.now();
        setElapsedSec(0);
        const intervalId = setInterval(() => {
          setElapsedSec(Math.round((Date.now() - startedAt) / 1000));
        }, 500);
        recognitionRef.current.__intervalId = intervalId;
      };

      recognition.onresult = (event) => {
        let current = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const speech = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            tempTranscript.current += speech + " ";
          } else {
            current += speech;
          }
        }
        setTranscript(tempTranscript.current + current);
        const len = (tempTranscript.current + current).trim().length;
        if (len <= lastTranscriptLengthRef.current) {
          pauseCountRef.current += 1;
        }
        lastTranscriptLengthRef.current = len;
      };

      recognition.onerror = (e) => {
        console.error("Speech Recognition Error:", e.error);
        setErrorMsg(`Speech recognition error: ${e.error}`);
        setIsRecording(false);
        recognition.stop();
      };

      recognition.onend = () => {
        setIsRecording(false);
        stopAudio();
        if (recognitionRef.current?.__intervalId) {
          clearInterval(recognitionRef.current.__intervalId);
          recognitionRef.current.__intervalId = null;
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (error) {
      console.error("Mic access error:", error);
      setErrorMsg("Microphone access denied or unavailable.");
    }
  };

  const stopAudio = () => {
    if (micStreamRef.current) micStreamRef.current.getTracks().forEach((t) => t.stop());
    if (audioContextRef.current) audioContextRef.current.close();
  };

  const stopRecording = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    stopAudio();
    setIsRecording(false);
    if (recognitionRef.current?.__intervalId) {
      clearInterval(recognitionRef.current.__intervalId);
      recognitionRef.current.__intervalId = null;
    }
  };

  // Submit evaluation to backend
  const submitEvaluation = async (allAnswers, perQuestionMetrics) => {
    const token = localStorage.getItem("token");
    if (!token) return console.error("No token found!");
    try {
      const response = await axios.post(
        evaluateUrl,
        {
          data: {
            qa: questions.map((q, i) => ({
              question: q,
              answer: allAnswers[i] || "",
              avgVolume: perQuestionMetrics[i]?.avgVolume ?? 0,
              wordsPerMinute: perQuestionMetrics[i]?.wordsPerMinute ?? 0,
              pauseCount: perQuestionMetrics[i]?.pauseCount ?? 0,
              speakingDurationSec: perQuestionMetrics[i]?.speakingDurationSec ?? 0,
            })),
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      navigate("/evaluate", { state: response.data });

      console.log("Evaluation result:", response.data);
      alert("Interview evaluation completed! Check console for details.");
    } catch (err) {
      console.error("Evaluation error:", err);
      setErrorMsg("Failed to submit evaluation.");
    }
  };

  // Go to next question
  const nextQuestion = () => {
    // compute metrics for current question
    const now = Date.now();
    const durationMs = questionStartTime ? now - questionStartTime : 0;
    const durationSec = durationMs / 1000;
    const words = transcript.trim().split(/\s+/).filter(Boolean).length;
    const wpm = durationSec > 0 ? Math.round((words / durationSec) * 60) : 0;
    const avgVolume = volumeSamplesRef.current.length
      ? Math.round(
          volumeSamplesRef.current.reduce((a, b) => a + b, 0) /
            volumeSamplesRef.current.length
        )
      : 0;

    const newAnswers = [...answers, transcript.trim()];
    setAnswers(newAnswers);
    setTranscript("");
    tempTranscript.current = "";
    const existingMetrics = JSON.parse(
      sessionStorage.getItem("interview_metrics") || "[]"
    );
    const newMetrics = [
      ...existingMetrics,
      {
        avgVolume,
        wordsPerMinute: wpm,
        pauseCount: pauseCountRef.current,
        speakingDurationSec: Math.round(durationSec),
      },
    ];
    sessionStorage.setItem("interview_metrics", JSON.stringify(newMetrics));

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Last question → submit answers
      submitEvaluation(newAnswers, newMetrics);
      setCurrentQuestionIndex(0);
      setAnswers([]);
      sessionStorage.removeItem("interview_metrics");
    }
  };

  if (loading) {
    return <div style={{ padding: "30px", textAlign: "center", background: "#0f172a", minHeight: "100vh", color: "#e2e8f0" }}>Loading questions...</div>;
  }

  if (!questions.length) {
    return <div style={{ padding: "30px", textAlign: "center", background: "#0f172a", minHeight: "100vh", color: "#e2e8f0" }}>No questions available.</div>;
  }

  const total = questions.length;
  const progressPct = total ? Math.round(((currentQuestionIndex + 1) / total) * 100) : 0;

  return (
    <div style={{ padding: "30px", fontFamily: "Arial", textAlign: "center", background: "#0f172a", minHeight: "100vh", color: "#e2e8f0" }}>
      <h2 style={{ marginBottom: 8, color: "#e2e8f0" }}>🎤 Interview Practice</h2>
      <div style={{ maxWidth: 820, margin: "0 auto", textAlign: "left" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <span style={{ fontWeight: 600, color: "#e2e8f0" }}>Question {currentQuestionIndex + 1} / {total}</span>
          <span style={{ color: "#94a3b8" }}>Time: {Math.floor(elapsedSec/60)}:{("0" + (elapsedSec%60)).slice(-2)}</span>
          {isRecording && (
            <span style={{ color: "#f87171", fontWeight: 600 }}>● Recording</span>
          )}
        </div>
        <div style={{ height: 8, background: "#334155", borderRadius: 6, overflow: "hidden", marginBottom: 16 }}>
          <div style={{ width: `${progressPct}%`, height: "100%", background: "linear-gradient(90deg, #3b82f6, #8b5cf6)", transition: "width .3s" }}></div>
        </div>
      </div>

      <p style={{ fontSize: "18px", fontWeight: "bold", maxWidth: 820, margin: "0 auto 12px", color: "#e2e8f0" }}>
        {questions[currentQuestionIndex]}
      </p>

      <button
        onClick={isRecording ? stopRecording : startRecording}
        style={{
          background: isRecording ? "#e74c3c" : "#2ecc71",
          color: "white",
          border: "none",
          padding: "10px 20px",
          borderRadius: "8px",
          cursor: "pointer",
          fontSize: "16px",
          marginRight: "10px",
        }}
      >
        {isRecording ? "🛑 Stop Recording" : "🎙 Start Recording"}
      </button>

      <button
        onClick={nextQuestion}
        style={{
          background: "#3498db",
          color: "white",
          border: "none",
          padding: "10px 20px",
          borderRadius: "8px",
          cursor: "pointer",
          fontSize: "16px",
        }}
        disabled={isRecording}
      >
        {currentQuestionIndex < total - 1 ? "Next" : "Submit"}
      </button>

      {errorMsg && <p style={{ color: "#f87171", marginTop: "10px" }}>{errorMsg}</p>}

      {/* 🎚 Microphone Level Visualizer */}
      <div
        style={{
          height: "15px",
          width: "200px",
          background: "#334155",
          margin: "20px auto",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${Math.min(volume, 100)}%`,
            background:
              volume > 60 ? "#f87171" : volume > 30 ? "#fbbf24" : "#10b981",
            transition: "width 0.1s ease-in-out",
          }}
        ></div>
      </div>

      {/* Live metrics preview */}
      <div style={{ display: "flex", gap: 16, justifyContent: "center", color: "#94a3b8", marginBottom: 8 }}>
        <span>WPM: {(() => {
          const words = transcript.trim().split(/\s+/).filter(Boolean).length;
          return elapsedSec > 0 ? Math.round((words / elapsedSec) * 60) : 0;
        })()}</span>
        <span>Pauses: {pauseCountRef.current}</span>
        <span>Avg Vol: {Math.round(volume)}</span>
      </div>

      <div
        style={{
          marginTop: "20px",
          border: "1px solid rgba(59, 130, 246, 0.3)",
          borderRadius: "8px",
          padding: "15px",
          background: "#1e293b",
          minHeight: "100px",
          textAlign: "left",
          color: "#e2e8f0",
        }}
      >
        {transcript || (isRecording ? "Listening..." : "No speech detected yet.")}
      </div>

      <p style={{ color: "#94a3b8", fontSize: 12, marginTop: 10 }}>
        Tip: Speak clearly with steady pace. Click Stop before moving to the next question.
      </p>
    </div>
  );
}

export default InterviewApp;
