export default function adminFetch(url, options = {}) {
    const token = localStorage.getItem('adminToken');
    const baseURL = 'http://localhost:5001';
    const fullURL = url.startsWith('http') ? url : `${baseURL}${url}`;

    const headers = {
        ...(options.headers || {}),
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return fetch(fullURL, { ...options, headers });
} 