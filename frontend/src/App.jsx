import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import ProfessorCreateExamPage from "./pages/ProfessorCreateExamPage";
import StudentExamAttemptPage from "./pages/StudentExamAttemptPage";
import StudentExamsPage from "./pages/StudentExamsPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<DashboardPage />} />
      </Route>

      <Route element={<ProtectedRoute roles={["Student"]} />}>
        <Route path="/student/exams" element={<StudentExamsPage />} />
        <Route path="/student/exams/:examId/attempt" element={<StudentExamAttemptPage />} />
      </Route>

      <Route element={<ProtectedRoute roles={["Professor", "Admin"]} />}>
        <Route path="/professor/exams/create" element={<ProfessorCreateExamPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
