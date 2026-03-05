const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081/api/v1';

class ApiClient {
    constructor() {
        this.baseURL = API_BASE;
    }

    getToken() {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('access_token');
    }

    setTokens(accessToken, refreshToken) {
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);
    }

    clearTokens() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
    }

    async request(method, path, body = null, auth = true) {
        const headers = { 'Content-Type': 'application/json' };
        if (auth) {
            const token = this.getToken();
            if (token) headers['Authorization'] = `Bearer ${token}`;
        }

        const opts = { method, headers };
        if (body) opts.body = JSON.stringify(body);

        const res = await fetch(`${this.baseURL}${path}`, opts);

        if (res.status === 401 && auth) {
            const refreshed = await this.tryRefresh();
            if (refreshed) {
                headers['Authorization'] = `Bearer ${this.getToken()}`;
                const retry = await fetch(`${this.baseURL}${path}`, { ...opts, headers });
                return retry.json();
            }
            this.clearTokens();
            window.location.href = '/login';
            return null;
        }

        return res.json();
    }

    async tryRefresh() {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) return false;
        try {
            const res = await fetch(`${this.baseURL}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: refreshToken }),
            });
            if (!res.ok) return false;
            const data = await res.json();
            if (data.success && data.data?.access_token) {
                localStorage.setItem('access_token', data.data.access_token);
                return true;
            }
            return false;
        } catch { return false; }
    }

    // Auth
    register(data) { return this.request('POST', '/auth/register', data, false); }
    login(data) { return this.request('POST', '/auth/login', data, false); }
    getMe() { return this.request('GET', '/auth/me'); }

    // LMS
    getTracks() { return this.request('GET', '/tracks', null, false); }
    getTrack(id) { return this.request('GET', `/tracks/${id}`); }
    getCourse(id) { return this.request('GET', `/courses/${id}`); }
    getLesson(id) { return this.request('GET', `/lessons/${id}`); }
    recordProgress(data) { return this.request('POST', '/progress', data); }
    getMyProgress() { return this.request('GET', '/progress/me'); }

    // Instructor Content Creation
    createTrack(data) { return this.request('POST', '/tracks', data); }
    createCourse(data) { return this.request('POST', '/courses', data); }
    createLesson(data) { return this.request('POST', '/lessons', data); }
    updateCourse(id, data) { return this.request('PUT', `/courses/${id}`, data); }
    updateLesson(id, data) { return this.request('PUT', `/lessons/${id}`, data); }

    // Media Upload
    async uploadMedia(file) {
        const formData = new FormData();
        formData.append('file', file);

        const headers = {};
        const token = this.getToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`${this.baseURL}/media/upload`, {
            method: 'POST',
            headers,
            body: formData, // fetch will automatically set correct multipart/form-data boundary
        });

        if (res.status === 401) {
            this.clearTokens();
            window.location.href = '/login';
            return null;
        }

        return res.json();
    }

    // Certification
    getCertifications() { return this.request('GET', '/certifications', null, false); }
    getExam(id) { return this.request('GET', `/exams/${id}`); }
    startExam(id) { return this.request('POST', `/exams/${id}/start`); }
    submitExam(id, answers) { return this.request('PUT', `/exams/${id}/submit`, { answers }); }
    getExamResult(id) { return this.request('GET', `/exams/${id}/result`); }
    getMyCertificates() { return this.request('GET', '/certificates/me'); }
    verifyCertificate(id) { return this.request('GET', `/certificates/${id}/verify`, null, false); }

    // Talent
    getMyProfile() { return this.request('GET', '/talent/profile/me'); }
    updateMyProfile(data) { return this.request('PUT', '/talent/profile/me', data); }
    getRanking(params) { return this.request('GET', `/talent/ranking?${new URLSearchParams(params)}`); }
    searchTalent(params) { return this.request('GET', `/talent/search?${new URLSearchParams(params)}`); }
    getMyScore() { return this.request('GET', '/talent/score/me'); }

    // Placement
    getKitchens() { return this.request('GET', '/kitchens'); }
    createKitchen(data) { return this.request('POST', '/kitchens', data); }
    getPositions(params) { return this.request('GET', `/positions?${new URLSearchParams(params || {})}`); }
    createPosition(data) { return this.request('POST', '/positions', data); }
    proposePlacement(data) { return this.request('POST', '/placements', data); }
    updatePlacement(id, data) { return this.request('PUT', `/placements/${id}`, data); }
    getMyPlacements() { return this.request('GET', '/placements/me'); }
}

const api = new ApiClient();
export default api;
