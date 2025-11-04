import { BrowserRouter as Router, Routes, Route } from "react-router";
import HomePage from "@/react-app/pages/Home";
import AdminPage from "@/react-app/pages/Admin";
import StreamerRegistration from "@/react-app/pages/StreamerRegistration";
import ClipsPage from "@/react-app/pages/ClipsPage";
import StreamerProfilePage from "@/react-app/pages/StreamerProfilePage";
import LogsViewer from "@/react-app/components/LogsViewer";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/logs" element={<LogsViewer />} />
        <Route path="/register" element={<StreamerRegistration />} />
        <Route path="/clips" element={<ClipsPage />} />
        <Route path="/streamer/:streamerName" element={<StreamerProfilePage />} />
      </Routes>
    </Router>
  );
}
