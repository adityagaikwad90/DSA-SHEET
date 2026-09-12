import { Routes, Route } from "react-router-dom";
import Home from './pages/Home';
import Questions from './pages/Questions';
import MySheet from './pages/MySheet';
import Login from './pages/Login';
import Register from './pages/Register';
import DsaVault from './pages/DsaVault';
import ClubChat from './pages/ClubChat';
import AiChat from './pages/AiChat';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './Navbar';
import RewardCelebration from './components/RewardCelebration';
import ClickSparkEffect from './components/ClickSparkEffect';
import ScrollToTop from './components/ScrollToTop';
import './App.css';

function App() {
  return (
    <div className="app">
      <ScrollToTop />
      <ClickSparkEffect />
      <RewardCelebration />
      <Navbar />
      <main className="main-content page-enter">
        <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/questions" element={<Questions />} />
        <Route path="/sheet" element={
          <PrivateRoute>
            <MySheet />
          </PrivateRoute>
        } />
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
