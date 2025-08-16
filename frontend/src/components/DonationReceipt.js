import React, { forwardRef } from 'react';

const DonationReceipt = forwardRef(({ donation, user }, ref) => {
    if (!donation) return null;
    const campaignTitle = donation.campaign?.title || donation.campaignTitle || 'Campaign';
    const campaignId = donation.campaign?._id || donation.campaignId || '';
    const donorName = donation.donorName || user?.name || 'Anonymous';
    const email = user?.email || donation.donorEmail || '';
    const amount = donation.amount ? `₹${donation.amount}` : 'N/A';
    // Use createdAt or date, fallback to N/A
    const dateRaw = donation.createdAt || donation.date;
    const date = dateRaw ? new Date(dateRaw).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';
    const status = donation.status || 'Completed';
    const campaignLink = campaignId ? `http://localhost:3000/campaign/${campaignId}` : null;

    return (
        <div ref={ref} style={{ fontFamily: 'Segoe UI, Arial, sans-serif', maxWidth: 400, margin: '0 auto', border: '1px solid #e5e7eb', borderRadius: 12, boxShadow: '0 2px 8px #0001', padding: 32, background: '#fff' }}>
            {/* Platform Logo */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <div style={{ height: 32, width: 32, background: '#4F46E5', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
                    <svg height="20" width="20" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                </div>
                <span style={{ fontWeight: 700, fontSize: 20, color: '#22223b', letterSpacing: 1 }}>CrowdFund</span>
            </div>
            <h2 style={{ textAlign: 'center', color: '#4F46E5', marginBottom: 16 }}>Donation Receipt</h2>
            <hr style={{ marginBottom: 16, border: 'none', borderTop: '1px solid #e5e7eb' }} />
            <div style={{ marginBottom: 12 }}><strong>Donor:</strong> {donorName}</div>
            <div style={{ marginBottom: 12 }}><strong>Email:</strong> {email}</div>
            <div style={{ marginBottom: 12 }}><strong>Campaign:</strong> {campaignLink ? <a href={campaignLink} style={{ color: '#4F46E5', textDecoration: 'underline' }} target="_blank" rel="noopener noreferrer">{campaignTitle}</a> : campaignTitle}</div>
            <div style={{ marginBottom: 12 }}><strong>Amount:</strong> <span style={{ color: '#059669', fontWeight: 'bold' }}>{amount}</span></div>
            <div style={{ marginBottom: 12 }}><strong>Date:</strong> {date}</div>
            <div style={{ marginBottom: 12 }}><strong>Status:</strong> <span style={{ color: '#059669' }}>{status}</span></div>
            <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />
            <div style={{ textAlign: 'center', color: '#374151', fontSize: 15, marginTop: 16 }}>Thank you for your generous contribution!<br />This receipt is system generated.</div>
        </div>
    );
});

export default DonationReceipt; 