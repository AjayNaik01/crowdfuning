import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Utility function to format date to dd/mm/yyyy
function formatDateToDDMMYYYY(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

// Utility to convert dd/mm/yyyy to yyyy-mm-dd (for input type="date")
function parseDDMMYYYYtoISO(ddmmyyyy) {
    if (!ddmmyyyy) return '';
    const [day, month, year] = ddmmyyyy.split('/');
    if (!day || !month || !year) return '';
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

// Utility to convert yyyy-mm-dd to dd/mm/yyyy
function parseISOToDDMMYYYY(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

const KYCForm = () => {
    const [formData, setFormData] = useState({
        name: '',
        dob: '',
        gender: '',
        aadhaar_number: '',
        father_name: '',
        pan_number: '',
        idType: '',
        idCard: null,
        faceImage: null
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [errors, setErrors] = useState({});
    const [showModal, setShowModal] = useState(false);
    const [modalContent, setModalContent] = useState({ type: '', text: '' });

    const navigate = useNavigate();

    const idTypes = [
        { value: 'aadhaar', label: 'Aadhaar Card' },
        { value: 'pan', label: 'PAN Card' }
    ];

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if ((name === 'idCard' || name === 'faceImage') && files) {
            setFormData(prev => ({ ...prev, [name]: files[0] }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.idType) {
            newErrors.idType = 'Please select an ID type';
        }
        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }
        if (!formData.dob) {
            newErrors.dob = 'Date of birth is required';
        }
        if (!formData.idCard) {
            newErrors.idCard = 'ID image is required';
        }
        if (!formData.faceImage) {
            newErrors.faceImage = 'Face image is required';
        }
        if (formData.idType === 'aadhaar') {
            if (!formData.gender.trim()) {
                newErrors.gender = 'Gender is required';
            }
            if (!formData.aadhaar_number.trim()) {
                newErrors.aadhaar_number = 'Aadhaar number is required';
            }
        } else if (formData.idType === 'pan') {
            if (!formData.father_name.trim()) {
                newErrors.father_name = 'Father name is required';
            }
            if (!formData.pan_number.trim()) {
                newErrors.pan_number = 'PAN number is required';
            }
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setLoading(true);
        setMessage({ type: '', text: '' });
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setMessage({ type: 'error', text: 'Please login first' });
                navigate('/login');
                return;
            }
            const formDataToSend = new FormData();
            formDataToSend.append('idType', formData.idType === 'pan' ? 'PAN' : 'AADHAR');
            formDataToSend.append('name', formData.name);
            formDataToSend.append('dob', parseDDMMYYYYtoISO(formData.dob));
            formDataToSend.append('idCard', formData.idCard);
            formDataToSend.append('faceImage', formData.faceImage);
            if (formData.idType === 'aadhaar') {
                formDataToSend.append('gender', formData.gender);
                formDataToSend.append('aadhaar_number', formData.aadhaar_number);
            } else if (formData.idType === 'pan') {
                formDataToSend.append('father_name', formData.father_name);
                formDataToSend.append('pan_number', formData.pan_number);
            }
            const response = await fetch('http://localhost:5001/api/kyc/verify', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formDataToSend
            });
            const data = await response.json();
            if (data.success && data.data.status === 'VERIFIED') {
                // Update user data in localStorage with new KYC status
                const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                const updatedUser = { ...currentUser, kycStatus: 'VERIFIED' };
                localStorage.setItem('user', JSON.stringify(updatedUser));

                setModalContent({ type: 'success', text: 'KYC verification successful! You can now create or support campaigns.' });
                setShowModal(true);
            } else {
                setModalContent({ type: 'error', text: data.message || 'KYC verification failed. Please check your details and try again.' });
                setShowModal(true);
            }
        } catch (error) {
            setModalContent({ type: 'error', text: 'Network error. Please try again.' });
            setShowModal(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-lg shadow-lg p-8">
                    <div className="text-center mb-8">
                        <div className="mx-auto h-12 w-12 bg-indigo-600 rounded-full flex items-center justify-center mb-4">
                            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">
                            Complete Your KYC
                        </h2>
                        <p className="text-gray-600">
                            Verify your identity to start creating campaigns and raising funds
                        </p>
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                            <p className="text-sm text-blue-800">
                                <strong>Important:</strong> Each Aadhaar number and PAN number can only be used once for KYC verification.
                                If you've already used an ID number, please use a different one or contact support.
                            </p>
                        </div>
                    </div>
                    {message.text && (
                        <div className={`rounded-md p-4 mb-6 ${message.type === 'success'
                            ? 'bg-green-50 border border-green-200'
                            : 'bg-red-50 border border-red-200'
                            }`}>
                            <p className={`text-sm ${message.type === 'success' ? 'text-green-800' : 'text-red-800'
                                }`}>
                                {message.text}
                            </p>
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="bg-gray-50 p-6 rounded-lg">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Identity Verification</h3>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="idType" className="block text-sm font-medium text-gray-700 mb-1">
                                        ID Type *
                                    </label>
                                    <select
                                        id="idType"
                                        name="idType"
                                        value={formData.idType}
                                        onChange={handleChange}
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.idType ? 'border-red-300' : 'border-gray-300'}`}
                                    >
                                        <option value="">Select ID type</option>
                                        {idTypes.map(type => (
                                            <option key={type.value} value={type.value}>
                                                {type.label}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.idType && <p className="mt-1 text-sm text-red-600">{errors.idType}</p>}
                                </div>
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                        Name *
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.name ? 'border-red-300' : 'border-gray-300'}`}
                                        placeholder="Enter your name"
                                    />
                                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                                </div>
                                <div>
                                    <label htmlFor="dob" className="block text-sm font-medium text-gray-700 mb-1">
                                        Date of Birth *
                                    </label>
                                    <input
                                        type="text"
                                        id="dob"
                                        name="dob"
                                        value={formData.dob}
                                        onChange={e => {
                                            // Only allow dd/mm/yyyy format
                                            let val = e.target.value.replace(/[^0-9/]/g, '');
                                            if (val.length === 2 || val.length === 5) {
                                                if (formData.dob.length < val.length) val += '/';
                                            }
                                            setFormData(prev => ({ ...prev, dob: val }));
                                            if (errors.dob) setErrors(prev => ({ ...prev, dob: '' }));
                                        }}
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.dob ? 'border-red-300' : 'border-gray-300'}`}
                                        placeholder="dd/mm/yyyy"
                                        maxLength={10}
                                        autoComplete="off"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">Format: dd/mm/yyyy</p>
                                    {errors.dob && <p className="mt-1 text-sm text-red-600">{errors.dob}</p>}
                                </div>
                                {formData.idType === 'aadhaar' && (
                                    <>
                                        <div>
                                            <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                                                Gender *
                                            </label>
                                            <input
                                                type="text"
                                                id="gender"
                                                name="gender"
                                                value={formData.gender}
                                                onChange={handleChange}
                                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.gender ? 'border-red-300' : 'border-gray-300'}`}
                                                placeholder="Enter gender"
                                            />
                                            {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender}</p>}
                                        </div>
                                        <div>
                                            <label htmlFor="aadhaar_number" className="block text-sm font-medium text-gray-700 mb-1">
                                                Aadhaar Number *
                                            </label>
                                            <input
                                                type="text"
                                                id="aadhaar_number"
                                                name="aadhaar_number"
                                                value={formData.aadhaar_number}
                                                onChange={handleChange}
                                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.aadhaar_number ? 'border-red-300' : 'border-gray-300'}`}
                                                placeholder="Enter Aadhaar number"
                                            />
                                            {errors.aadhaar_number && <p className="mt-1 text-sm text-red-600">{errors.aadhaar_number}</p>}
                                        </div>
                                    </>
                                )}
                                {formData.idType === 'pan' && (
                                    <>
                                        <div>
                                            <label htmlFor="father_name" className="block text-sm font-medium text-gray-700 mb-1">
                                                Father Name *
                                            </label>
                                            <input
                                                type="text"
                                                id="father_name"
                                                name="father_name"
                                                value={formData.father_name}
                                                onChange={handleChange}
                                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.father_name ? 'border-red-300' : 'border-gray-300'}`}
                                                placeholder="Enter father name"
                                            />
                                            {errors.father_name && <p className="mt-1 text-sm text-red-600">{errors.father_name}</p>}
                                        </div>
                                        <div>
                                            <label htmlFor="pan_number" className="block text-sm font-medium text-gray-700 mb-1">
                                                PAN Number *
                                            </label>
                                            <input
                                                type="text"
                                                id="pan_number"
                                                name="pan_number"
                                                value={formData.pan_number}
                                                onChange={handleChange}
                                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.pan_number ? 'border-red-300' : 'border-gray-300'}`}
                                                placeholder="Enter PAN number"
                                            />
                                            {errors.pan_number && <p className="mt-1 text-sm text-red-600">{errors.pan_number}</p>}
                                        </div>
                                    </>
                                )}
                                <div>
                                    <label htmlFor="idCard" className="block text-sm font-medium text-gray-700 mb-1">
                                        ID Image *
                                    </label>
                                    <input
                                        type="file"
                                        id="idCard"
                                        name="idCard"
                                        onChange={handleChange}
                                        accept="image/*"
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.idCard ? 'border-red-300' : 'border-gray-300'}`}
                                    />
                                    <p className="mt-1 text-sm text-gray-500">
                                        Upload a clear image of your ID document
                                    </p>
                                    {errors.idCard && <p className="mt-1 text-sm text-red-600">{errors.idCard}</p>}
                                </div>
                                <div>
                                    <label htmlFor="faceImage" className="block text-sm font-medium text-gray-700 mb-1">
                                        Face Image *
                                    </label>
                                    <input
                                        type="file"
                                        id="faceImage"
                                        name="faceImage"
                                        onChange={handleChange}
                                        accept="image/*"
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.faceImage ? 'border-red-300' : 'border-gray-300'}`}
                                    />
                                    <p className="mt-1 text-sm text-gray-500">
                                        Upload a clear live photo of your face
                                    </p>
                                    {errors.faceImage && <p className="mt-1 text-sm text-red-600">{errors.faceImage}</p>}
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <div className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Submitting...
                                    </div>
                                ) : (
                                    'Submit KYC Application'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            {/* Modal for alerts */}
            {showModal && (
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
                    <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
                        <div className="mb-4">
                            {modalContent.type === 'success' ? (
                                <svg className="mx-auto h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            ) : (
                                <svg className="mx-auto h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            )}
                        </div>
                        <h3 className={`text-xl font-semibold mb-2 ${modalContent.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>{modalContent.type === 'success' ? 'Success' : 'Error'}</h3>
                        <p className="mb-6 text-gray-700">{modalContent.text}</p>
                        <button
                            className={`w-full py-2 px-4 rounded-md font-medium focus:outline-none focus:ring-2 ${modalContent.type === 'success' ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500' : 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'}`}
                            onClick={() => {
                                setShowModal(false);
                                if (modalContent.type === 'success') {
                                    navigate('/campaigns');
                                }
                            }}
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default KYCForm;