import React, { useState } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

const ContactPage = () => {
    const [form, setForm] = useState({ name: '', email: '', message: '' });
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus('');
        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            if (res.ok) {
                setStatus('success');
                setForm({ name: '', email: '', message: '' });
            } else {
                setStatus('error');
            }
        } catch {
            setStatus('error');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Navbar />
            <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
                <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-10 border border-gray-100">
                    <h2 className="text-3xl font-bold text-indigo-700 mb-2 text-center">Contact Us</h2>
                    <p className="text-gray-500 mb-8 text-center">We'd love to hear from you! Fill out the form below.</p>
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                autoComplete="name"
                                required
                                value={form.name}
                                onChange={handleChange}
                                className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                                placeholder="Your Name"
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={form.email}
                                onChange={handleChange}
                                className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                                placeholder="you@example.com"
                            />
                        </div>
                        <div>
                            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                            <textarea
                                id="message"
                                name="message"
                                required
                                rows={5}
                                value={form.message}
                                onChange={handleChange}
                                className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                                placeholder="Type your message here..."
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition"
                        >
                            {loading ? 'Sending...' : 'Send Message'}
                        </button>
                        {status === 'success' && (
                            <div className="text-green-600 text-center mt-2">Message sent successfully!</div>
                        )}
                        {status === 'error' && (
                            <div className="text-red-600 text-center mt-2">Failed to send message. Please try again.</div>
                        )}
                    </form>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default ContactPage; 