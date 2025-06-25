import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import RegisterForm from './components/RegisterForm';
import OtpVerification from './components/OtpVerification';
import LoginForm from './components/LoginForm';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import KYCForm from './components/KYCForm';
import KYCStatus from './components/KYCStatus';
import CreateCampaign from './components/CreateCampaign';
import MyCampaigns from './components/MyCampaigns';
import CampaignsPage from './components/CampaignsPage';
import DonationForm from './components/DonationForm';
import DonationHistory from './components/DonationHistory';
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';
import EditCampaign from './components/EditCampaign';
import CampaignDetails from './components/CampaignDetails';
import Notifications from './components/Notifications';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Landing page as default */}
          <Route path="/" element={<LandingPage />} />

          {/* Auth routes */}
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/verify-otp" element={<OtpVerification />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* KYC routes */}
          <Route path="/kyc" element={<KYCForm />} />
          <Route path="/kyc-status" element={<KYCStatus />} />

          {/* Dashboard routes */}
          <Route path="/dashboard" element={<UserDashboard />} />

          {/* Campaign routes */}
          <Route path="/campaigns" element={<CampaignsPage />} />
          <Route path="/create-campaign" element={<CreateCampaign />} />
          <Route path="/my-campaigns" element={<MyCampaigns />} />
          <Route path="/campaign/create" element={<Navigate to="/create-campaign" replace />} />
          <Route path="/campaign/:campaignId" element={<CampaignDetails />} />
          <Route path="/campaign/:id/edit" element={<EditCampaign />} />

          {/* Donation routes */}
          <Route path="/donate/:campaignId" element={<DonationForm />} />
          <Route path="/donations" element={<DonationHistory />} />

          {/* Admin routes */}
          <Route path="/admin" element={<AdminDashboard />} />

          {/* Catch all route - redirect to landing */}
          <Route path="*" element={<Navigate to="/" replace />} />

          {/* Notifications routes */}
          <Route path="/notifications" element={<Notifications />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
