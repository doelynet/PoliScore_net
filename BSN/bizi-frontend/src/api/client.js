import axios from 'axios';



const client =axios.create({
    baseURL: import.meta.env.VITE_APP_URL,
    timeout: 10000,
    headers: {'Content-Type': 'application/json'},
});
client.interceptors.request.use(config => {
    const raw = localStorage.getItem('bizi-auth');
    if (!raw) return config;

    try {
    const { state } = JSON.parse(raw);
    if (state?.token) {
        config.headers.Authorization = `Bearer ${state.token}`;
    }
    // eslint-disable-next-line no-unused-vars
    } catch (_) {
    console.warn("Auth storage corrupted");
    }

    return config;
});
    //401 clears auth and redirects to login
client.interceptors.response.use(
  res => res,  // pass through successful responses
    err => {
    if (err.response?.status === 401) {
        localStorage.removeItem('bizi-auth');
        window.location.href = '/login';
    }
    // Normalise error shape so callers always get err.message
    const message =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.msg ||
        err.message ||
            'Something went wrong';
    return Promise.reject(new Error(message));
    }
);

export default client;    