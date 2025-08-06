import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import ExplorePage from './pages/ExplorePage';
import DiscussionPage from './pages/DiscussionPage';
import TestVoicePage from './pages/TestVoicePage';
import ProfilePage from './pages/ProfilePage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-900">
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/discussion/explore" element={<ExplorePage />} />
          <Route path="/discussion/:topicId" element={<DiscussionPage />} />
          <Route path="/test-voice" element={<TestVoicePage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
