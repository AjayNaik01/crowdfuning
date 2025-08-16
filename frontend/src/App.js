import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import RegisterForm from './components/RegisterForm';
import OtpVerification from './components/OtpVerification';
import LoginForm from './components/LoginForm';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import KYCStepperForm from './components/KYCStepperForm';
import CreateCampaign from './components/CreateCampaign';
import MyCampaigns from './components/MyCampaigns';
import CampaignsPage from './components/CampaignsPage';
import AdminPage from './components/admin/AdminPage';
import EditCampaign from './components/EditCampaign';
import CampaignDetails from './components/CampaignDetails';
import CampaignReview from './components/CampaignReview';
import Notifications from './components/Notifications';
import DonationHistory from './components/DonationHistory';
import AdminLogin from './components/admin/AdminLogin';
import CampaignDocumentsAdmin from './components/admin/CampaignDocumentsAdmin';
import ContactPage from './components/ContactPage';
import EditProfile from './components/EditProfile';
import './App.css';
import ChatbotWidget from './components/ChatbotWidget';

// Debug component to track route changes
const RouteDebugger = () => {
  const location = useLocation();
  console.log('App.js: Current route:', location.pathname);
  return null;
};

function App() {
  console.log('App.js: App component rendered');

  return (
    <Router>
      <RouteDebugger />
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
          <Route path="/kyc" element={<KYCStepperForm />} />


          {/* Campaign routes */}
          <Route path="/campaigns" element={<CampaignsPage />} />
          <Route path="/create-campaign" element={<CreateCampaign />} />
          <Route path="/my-campaigns" element={<MyCampaigns />} />
          <Route path="/campaign/create" element={<Navigate to="/create-campaign" replace />} />
          <Route path="/campaign/:campaignId" element={<CampaignDetails />} />
          <Route path="/campaign/:campaignId/review" element={<CampaignReview />} />
          <Route path="/campaign/:id/edit" element={<EditCampaign />} />

          {/* Admin routes */}
          <Route path="/admin/*" element={<AdminPage />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/campaigns/:campaignId/documents" element={<CampaignDocumentsAdmin />} />

          {/* Notifications route */}
          <Route path="/notifications" element={<Notifications />} />

          {/* Contact route */}
          <Route path="/contact" element={<ContactPage />} />

          {/* Donation History route */}
          <Route
            path="/donation-history"
            element={
              <div>
                {console.log('App.js: DonationHistory route matched')}
                <DonationHistory />
              </div>
            }
          />
          {/* Catch all route - redirect to landing */}
          {/* <Route
            path="*"
            element={
              <div>
                {console.log('App.js: Catch-all route matched, redirecting to /')}
                <Navigate to="/" replace />
              </div>
            }
          /> */}

          {/* Profile routes */}
          <Route path="/profile/edit" element={<EditProfile />} />
        </Routes>
        <ChatbotWidget />
      </div>
    </Router>
  );
}

export default App;
