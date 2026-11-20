import { Routes, Route } from "react-router-dom";
import Home from './pages/Home';
import Questions from './pages/Questions';
import MySheet from './pages/MySheet';
import Login from './pages/Login';
import Register from './pages/Register';
import DsaVault from './pages/DsaVault';
import ClubChat from './pages/ClubChat';
import AiChat from './pages/AiChat';
import InterviewHub from './pages/InterviewHub';
import PatternLesson from './pages/PatternLesson';
import TechNews from './pages/TechNews';
import Careers from './pages/Careers';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './Navbar';
import RewardCelebration from './components/RewardCelebration';
import ClickSparkEffect from './components/ClickSparkEffect';
import ScrollToTop from './components/ScrollToTop';
import FuturisticFloatingAi from './components/FuturisticFloatingAi';
import { Toaster } from 'sonner';
import './App.css';

function App() {
  return (
    <div className="app">
      <Toaster position="bottom-left" richColors theme="dark" />
      <ScrollToTop />
      <ClickSparkEffect />
      <RewardCelebration />
      <FuturisticFloatingAi />
      <Navbar />
      <main className="main-content page-enter">
        <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/news" element={<TechNews />} />
        <Route path="/tech-news" element={<TechNews />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes (Require Login) */}
        <Route path="/questions" element={<PrivateRoute><Questions /></PrivateRoute>} />
        <Route path="/top-100" element={<PrivateRoute><Questions /></PrivateRoute>} />
        <Route path="/interview-hub" element={<PrivateRoute><InterviewHub /></PrivateRoute>} />
        <Route path="/interview-hub/dsa" element={<PrivateRoute><InterviewHub defaultTab="dsa" /></PrivateRoute>} />
        <Route path="/interview-hub/system-design" element={<PrivateRoute><InterviewHub defaultTab="system-design" /></PrivateRoute>} />
        <Route path="/interview-hub/networking" element={<PrivateRoute><InterviewHub defaultTab="networking" /></PrivateRoute>} />
        <Route path="/interview-hub/patterns" element={<PrivateRoute><InterviewHub defaultTab="dsa" /></PrivateRoute>} />
        <Route path="/interview-hub/patterns/:patternId" element={<PrivateRoute><PatternLesson /></PrivateRoute>} />
        <Route path="/patterns/:patternId" element={<PrivateRoute><PatternLesson /></PrivateRoute>} />
        <Route path="/sheet" element={<PrivateRoute><MySheet /></PrivateRoute>} />
        <Route path="/careers" element={<PrivateRoute><Careers /></PrivateRoute>} />
        <Route path="/dsa-vault" element={
          <PrivateRoute>
            <DsaVault />
          </PrivateRoute>
        } />
        <Route path="/club" element={
          <PrivateRoute>
            <ClubChat />
          </PrivateRoute>
        } />
        <Route path="/ask-ai" element={
          <PrivateRoute>
            <AiChat />
          </PrivateRoute>
        } />
      </Routes>
      </main>
    </div>
  );
}

export default App;
