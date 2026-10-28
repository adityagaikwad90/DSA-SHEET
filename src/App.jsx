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
import PrivateRoute from './components/PrivateRoute';
import Navbar from './Navbar';
import RewardCelebration from './components/RewardCelebration';
import ClickSparkEffect from './components/ClickSparkEffect';
import ScrollToTop from './components/ScrollToTop';
import FuturisticFloatingAi from './components/FuturisticFloatingAi';
import './App.css';

function App() {
  return (
    <div className="app">
      <ScrollToTop />
      <ClickSparkEffect />
      <RewardCelebration />
      <FuturisticFloatingAi />
      <Navbar />
      <main className="main-content page-enter">
        <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/questions" element={<Questions />} />
        <Route path="/top-100" element={<Questions />} />
        <Route path="/interview-hub" element={<InterviewHub />} />
        <Route path="/interview-hub/dsa" element={<InterviewHub defaultTab="dsa" />} />
        <Route path="/interview-hub/system-design" element={<InterviewHub defaultTab="system-design" />} />
        <Route path="/interview-hub/networking" element={<InterviewHub defaultTab="networking" />} />
        <Route path="/interview-hub/patterns" element={<InterviewHub defaultTab="dsa" />} />
        <Route path="/interview-hub/patterns/:patternId" element={<PatternLesson />} />
        <Route path="/patterns/:patternId" element={<PatternLesson />} />
        <Route path="/sheet" element={<MySheet />} />
        <Route path="/news" element={<TechNews />} />
        <Route path="/tech-news" element={<TechNews />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
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
