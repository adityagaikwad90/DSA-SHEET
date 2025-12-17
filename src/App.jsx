import { Routes, Route } from "react-router-dom";
import Home from './pages/Home';
import Questions from './pages/Questions';
import MySheet from './pages/MySheet';
import Login from './pages/Login';
import Register from './pages/Register';
import DsaVault from './pages/DsaVault';
import ClubChat from './pages/ClubChat';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './Navbar';

function App() {
  return (
    <div className="app">
      <Navbar />
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
      </Routes>
    </div>
  );
}

export default App;
