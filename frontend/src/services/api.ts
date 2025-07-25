const API_URL = import.meta.env.VITE_PUBLIC_API_URL || "/api/v1/";

interface CommonOpts {
    headers: {
        "Content-Type": string;
        Authorization: string;
    };
}

// Helper to build fetch options with auth header
function getCommonOpts(): CommonOpts {
    const token = localStorage.getItem("accessToken");
    
    if (!token) {
        throw new Error("Нет JWT-токена");
    }
    return {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    };
}

// Authentication function
export const login = async (username: string, password: string): Promise<{ access_token: string; refresh_token: string; token_type: string }> => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const res = await fetch(`${API_URL}auth/jwt/create/`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: formData,
    });

    if (!res.ok) {
        if (res.status === 401) {
            throw new Error("Неверный логин или пароль");
        } else {
            throw new Error(`Ошибка сервера: ${res.status}`);
        }
    }

    return res.json();
};

// Check if token needs refresh
async function refreshTokenIfNeeded() {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
        throw new Error("Нет refresh-токена");
    }

    try {
        const formData = new URLSearchParams();
        formData.append('refresh_token', refreshToken);

        const res = await fetch(`${API_URL}auth/jwt/refresh/`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: formData,
        });

        if (!res.ok) {
            throw new Error(`Refresh token error: ${res.status}`);
        }

        const data = await res.json() as { access_token: string };
        localStorage.setItem("accessToken", data.access_token);
        return data.access_token;
    } catch (error) {
        console.error("Failed to refresh token:", error);
        // Clear tokens and redirect to login
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        throw error;
    }
}

export interface Counter {
    counter_name: string;
    value: number;
    max_value: number;
}

export interface UserData {
    id: number;
    username: string;
    name: string;
    staff: boolean;
    balance: number;
    expected_penalty: number;
    counters: Counter[];
    party: number;
    is_active: boolean;
}

export interface UserListItem {
    id: number;
    username: string;
    name: string;
    party: number,
    staff: boolean;
    balance: number;
}

export interface UserTransactionListItem extends UserListItem{
    isSelected: boolean;
    bucks: number;
}

export interface Statistics {
    avg_balance: number;
    total_balance: number;
}

export interface Transaction {
    id: number;
    author: string;
    description: string;
    type: string;
    status: string;
    date_created: string;
    receivers: Array<{
        username: string;
        bucks: number;
        certs: number;
        lab: number;
        lec: number;
        sem: number;
        fac: number;
    }>;
}

export interface TransactionCreate {
    type: string;
    description: string;
    recipients: Array<{
        id: number;
        amount: number;
    }>;
    update_of?: number; // For replacing transactions
}

async function request<T>(endpoint: string, opts?: RequestInit): Promise<T> {
    try {
        const commonOpts = getCommonOpts();
        const mergedOpts = {
            ...opts,
            headers: {
                ...commonOpts.headers,
                ...(opts?.headers || {}),
            },
        };

        const res = await fetch(`${API_URL}${endpoint}`, mergedOpts);
        
        if (res.status === 401) {
            // Token expired, attempt to refresh
            await refreshTokenIfNeeded();
            // Retry with new token
            const newOpts = getCommonOpts();
            const newMergedOpts = {
                ...opts,
                headers: {
                    ...newOpts.headers,
                    ...(opts?.headers || {}),
                },
            };
            const newRes = await fetch(`${API_URL}${endpoint}`, newMergedOpts);
            
            if (!newRes.ok) {
                throw new Error(`API error ${endpoint}: ${newRes.status}`);
            }
            return newRes.json();
        }
        
        if (!res.ok) {
            throw new Error(`API error ${endpoint}: ${res.status}`);
        }
        
        return res.json();
    } catch (error) {
        console.error(`Error in API request to ${endpoint}:`, error);
        
        // If we have auth errors that weren't resolved by refresh, redirect to login
        if (error instanceof Error && error.message.includes("JWT")) {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            window.location.href = "/login";
        }
        
        throw error;
    }
}

// File upload helper function
async function uploadFile(endpoint: string, file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const commonOpts = getCommonOpts();
        const opts = {
            method: 'POST',
            headers: {
                // Don't include Content-Type for multipart/form-data
                Authorization: commonOpts.headers.Authorization,
            },
            body: formData,
        };
        
        const res = await fetch(`${API_URL}${endpoint}`, opts);
        
        if (res.status === 401) {
            // Token expired, attempt to refresh
            await refreshTokenIfNeeded();
            // Retry with new token
            const newOpts = getCommonOpts();
            const newUploadOpts = {
                method: 'POST',
                headers: {
                    Authorization: newOpts.headers.Authorization,
                },
                body: formData,
            };
            const newRes = await fetch(`${API_URL}${endpoint}`, newUploadOpts);
            
            if (!newRes.ok) {
                throw new Error(`API error ${endpoint}: ${newRes.status}`);
            }
            return newRes.json();
        }
        
        if (!res.ok) {
            throw new Error(`API error ${endpoint}: ${res.status}`);
        }
        
        return res.json();
    } catch (error) {
        console.error(`Error in API request to ${endpoint}:`, error);
        throw error;
    }
}

// User management
export const getMe = (): Promise<UserData> => request<UserData>("users/me/");
export const getTransactions = (): Promise<Transaction[]> => request<Transaction[]>("transactions/");
export const getStatistics = (): Promise<Statistics> => request<Statistics>("statistics/");
export const getUsers = (): Promise<UserListItem[]> => request<UserListItem[]>("users/");
export const getUserByUsername = (username: string): Promise<UserData> => request<UserData>(`users/${username}/`);

// Import users from images with metadata in filenames
export const importUsersFromImages = (files: File[]): Promise<any> => {
    const formData = new FormData();
    files.forEach(file => {
        formData.append('files', file);
    });
    
    const commonOpts = getCommonOpts();
    return fetch(`${API_URL}users/import-images`, {
        method: 'POST',
        headers: {
            Authorization: commonOpts.headers.Authorization,
        },
        body: formData,
    }).then(response => {
        if (!response.ok) {
            throw new Error(`API error users/import-images: ${response.status}`);
        }
        return response.json();
    });
};

// Avatar management - simplified to use username-based approach
export const uploadAvatar = (username: string, file: File): Promise<UserData> => 
    uploadFile(`users/${username}/avatar`, file);
export const deleteAvatar = (username: string): Promise<UserData> =>
    request<UserData>(`users/${username}/avatar`, {
        method: "DELETE"
    });
export const adminSetUserAvatar = (username: string, file: File): Promise<UserData> => 
    uploadFile(`users/admin/set-avatar/${username}`, file);

// Helper function to get avatar URL by username and size
export const getAvatarUrl = (username: string, size: string = 'medium'): string => 
    `/media/avatars/${username}${size === 'original' ? '' : '_' + size}.png`;

// Transaction management
export const createTransaction = (data: TransactionCreate): Promise<Transaction> =>
    request<Transaction>("transactions/create/", {
        method: "POST",
        body: JSON.stringify(data),
    });

// Additional functions for transaction management
export const processTransaction = (id: number): Promise<Transaction> =>
    request<Transaction>(`transactions/${id}/process`, {
        method: "POST"
    });

export const declineTransaction = (id: number): Promise<Transaction> =>
    request<Transaction>(`transactions/${id}/decline`, {
        method: "POST"
    });

export const getTransactionById = (id: number): Promise<Transaction> =>
    request<Transaction>(`transactions/${id}`);

// Seminar interfaces and functions
export interface SeminarEvaluation {
    contentQuality: number;
    knowledgeQuality: number;
    presentationQuality: number;
    presentationQuality2: number;
    presentationQuality3: number;
    materials: number;
    unusualThings: number;
    discussion: number;
    generalQuality: number;
}

export interface SeminarCreate {
    speaker: string;
    block: string;
    description: string;
    evaluation: SeminarEvaluation;
    totalScore: number;
    attendees: string[];
}

export interface Seminar {
    id: number;
    speaker: string;
    speaker_name: string;
    block: string;
    evaluation: SeminarEvaluation;
    totalScore: number;
    attendees: string[];
    date_created: string;
    author: string;
}

// Seminar management
export const createSeminar = async (data: SeminarCreate): Promise<any> => {
    return request<any>("transactions/seminar/", {
        method: "POST",
        body: JSON.stringify(data),
    });
};

export const getSeminars = (): Promise<Seminar[]> => request<Seminar[]>("seminars/");

export const getSeminarById = (id: number): Promise<Seminar> => request<Seminar>(`seminars/${id}/`);
