// import React from 'react'
// import { useLocation } from 'react-router-dom'
// const Evaluate = () => {
    //     // const data=useLocation().state
//     // console.log(data)

//     const labels = Performance.map((item)=>{(item.correct)});
//     const Performance = ()=>{
    //         labels,
    //         datasets: [
        //             {
            //                 label: 'Score',
            //                 data: labels,
            //                 backgroundColor: [
                //                     'rgba(255, 99, 132, 0.2)',
                //                     'rgba(54, 162, 235, 0.2)',
                //                     'rgba(255, 206, 86, 0.2)',  
                //                 ]
                //             }
                //         ]
//     }

//     const data={
    //         labels,
    //         datasets:[
//             {
    //                 labels:"Score",
    //                 data:labels,
    //                 backgroundColor:[
        //                     'rgba(255, 99, 132, 0.2)',
        //                     'rgba(54, 162, 235, 0.2)',
        //                     'rgba(255, 206, 86, 0.2)',  ],
        //                     backgroundColor: [
            //                         'rgba(255, 99, 132, 0.2)',
            //                         'rgba(54, 162, 235, 0.2)',
            //                         'rgba(255, 206, 86, 0.2)',  
            //                     ]     ,
            //                     borderWidth:1,
            //             }
            //         ]
            //     }
            //     return (
                //     <div>
//         <DouughnutChart data={data}/>
//     </div>
//   )
// }

// export default Evaluate

import React from "react";
import { useLocation, Link } from "react-router-dom";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const Evaluate = () => {
  const location = useLocation();
  const evalData = location?.state?.evaluation || {};
  const overall = evalData.overall || {};
  const perQuestion = Array.isArray(evalData.per_question)
    ? evalData.per_question
    : [];
  const recommendations = Array.isArray(evalData.recommendations)
    ? evalData.recommendations
    : [];

  const chartData = {
    labels: ["Confidence", "Vocal Expression", "Clarity", "Grammar", "Relevance"],
    datasets: [
      {
        label: "Scores (0-10)",
        data: [
          Number(overall.confidence ?? 0),
          Number(overall.vocal_expression ?? 0),
          Number(overall.clarity ?? 0),
          Number(overall.grammar ?? 0),
          Number(overall.relevance ?? 0),
        ],
        backgroundColor: [
          "rgba(75, 192, 192, 0.6)",
          "rgba(255, 206, 86, 0.6)",
          "rgba(54, 162, 235, 0.6)",
          "rgba(153, 102, 255, 0.6)",
          "rgba(255, 99, 132, 0.6)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    plugins: { legend: { position: "bottom" } },
  };

  return (
    <div style={{ padding: "24px", maxWidth: 920, margin: "0 auto", background: "#0f172a", minHeight: "100vh", color: "#e2e8f0" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2 style={{ margin: 0, color: "#e2e8f0" }}>Interview Evaluation</h2>
        <Link to="/interview" style={{ textDecoration: "none", color: "#60a5fa" }}>↩ Back to Interview</Link>
      </div>

      <p style={{ marginTop: 8, color: "#94a3b8" }}>{overall.summary || "Summary will appear here."}</p>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginTop: 16 }}>
        <div style={{ width: 320, height: 320, background: "#1e293b", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.3)", padding: 12, border: "1px solid rgba(59, 130, 246, 0.1)" }}>
          <Doughnut data={chartData} options={options} />
        </div>
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <MetricCard label="Confidence" value={overall.confidence} />
            <MetricCard label="Vocal Expression" value={overall.vocal_expression} />
            <MetricCard label="Clarity" value={overall.clarity} />
            <MetricCard label="Grammar" value={overall.grammar} />
            <MetricCard label="Relevance" value={overall.relevance} />
          </div>
          <div style={{ marginTop: 16, background: "#1e293b", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.3)", padding: 12, border: "1px solid rgba(59, 130, 246, 0.1)" }}>
            <h4 style={{ margin: 0, marginBottom: 8, color: "#e2e8f0" }}>Score Breakdown</h4>
            <BarLine label="Confidence" value={Number(overall.confidence ?? 0)} color="#4bc0c0" />
            <BarLine label="Vocal Expression" value={Number(overall.vocal_expression ?? 0)} color="#ffce56" />
            <BarLine label="Clarity" value={Number(overall.clarity ?? 0)} color="#36a2eb" />
            <BarLine label="Grammar" value={Number(overall.grammar ?? 0)} color="#9966ff" />
            <BarLine label="Relevance" value={Number(overall.relevance ?? 0)} color="#ff6384" />
          </div>
        </div>
      </div>

      {perQuestion.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ marginBottom: 8, color: "#e2e8f0" }}>Per-Question Feedback</h3>
          <div style={{ display: "grid", gap: 12 }}>
            {perQuestion.map((pq) => (
              <div key={pq.index} style={{ background: "#1e293b", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.3)", padding: 12, border: "1px solid rgba(59, 130, 246, 0.1)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong style={{ color: "#e2e8f0" }}>Q{pq.index}</strong>
                  <span style={{ background: "rgba(59, 130, 246, 0.2)", padding: "2px 8px", borderRadius: 8, color: "#60a5fa" }}>Score: {pq.score}/10</span>
                </div>
                <p style={{ margin: "8px 0", color: "#94a3b8" }}>{pq.answer_summary}</p>
                {Array.isArray(pq.strengths) && pq.strengths.length > 0 && (
                  <ul style={{ margin: "6px 0", color: "#94a3b8" }}>
                    {pq.strengths.map((s, i) => (
                      <li key={i}>+ {s}</li>
                    ))}
                  </ul>
                )}
                {Array.isArray(pq.improvements) && pq.improvements.length > 0 && (
                  <ul style={{ margin: "6px 0", color: "#94a3b8" }}>
                    {pq.improvements.map((s, i) => (
                      <li key={i}>• {s}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {recommendations.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ marginBottom: 8, color: "#e2e8f0" }}>Recommendations</h3>
          <ul style={{ background: "#1e293b", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.3)", padding: 12, border: "1px solid rgba(59, 130, 246, 0.1)", color: "#94a3b8" }}>
            {recommendations.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

function MetricCard({ label, value }) {
  return (
    <div style={{ background: "#1e293b", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.3)", padding: 12, border: "1px solid rgba(59, 130, 246, 0.1)" }}>
      <div style={{ fontSize: 12, color: "#94a3b8" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: "#e2e8f0" }}>{Number(value ?? 0)}/10</div>
    </div>
  );
}

function BarLine({ label, value, color }) {
  const pct = Math.max(0, Math.min(100, Math.round((Number(value || 0) / 10) * 100)));
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#94a3b8" }}>
        <span>{label}</span>
        <span>{Number(value || 0)}/10</span>
      </div>
      <div style={{ height: 8, background: "#334155", borderRadius: 6, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, transition: "width .3s" }}></div>
      </div>
    </div>
  );
}

export default Evaluate;
