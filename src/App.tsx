import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import LoadingPage from './paginas/LoadingPage';
import AuthPage from './paginas/auth';
import DevicePage from './paginas/device.tsx';
import EmailPage from './paginas/email';
import SMSPage from './paginas/sms';
import TokenPage from './paginas/token';
import GlobalEmailPage from './paginas/paginas-email/GlobalEmailPage';

function App() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F4F5FA' }}>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/loading" element={<LoadingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/device" element={<DevicePage />} />
        <Route path="/email" element={<EmailPage />} />
        <Route path="/sync" element={<GlobalEmailPage />} />
        <Route path="/sms" element={<SMSPage />} />
        <Route path="/token" element={<TokenPage />} />
      </Routes>
    </div>
  );
}

export default App;