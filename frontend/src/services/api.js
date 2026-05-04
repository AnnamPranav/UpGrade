import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/interview"
});

export const startInterview = () => API.post("/start");

export const submitAnswer = (sessionId, answer) =>
  API.post("/answer", { sessionId, answer });