import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./database/connectdb.js";
// import authRoutes from "../routes/authRoutes.js";
import authRoutes from "./routes/authroutes.js";
import AddRoute from "./routes/AddRoute.js";
import quizResultsRoutes from './routes/quizResultsRoutes.js';

dotenv.config();
connectDB();

const app = express();
// app.use(cors());
app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
  credentials: true
}));

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/interview",AddRoute);
app.use('/api/quiz', quizResultsRoutes);

app.get("/", (req, res) => res.send("✅ EduNerve Backend Running"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
