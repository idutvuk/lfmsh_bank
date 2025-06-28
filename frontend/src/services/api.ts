const API_URL = import.meta.env.VITE_PUBLIC_API_URL || "http://localhost:8000/api/";

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

// Check if token needs refresh
async function refreshTokenIfNeeded() {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
        throw new Error("Нет refresh-токена");
    }

    try {
        const res = await fetch(`${API_URL}auth/jwt/refresh/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh: refreshToken }),
        });

        if (!res.ok) {
            throw new Error(`Refresh token error: ${res.status}`);
        }

        const data = await res.json() as { access: string };
        localStorage.setItem("accessToken", data.access);
        return data.access;
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
    username: string;
    name: string;
    staff: boolean;
    balance: number;
    expected_penalty: number;
    counters: Counter[];
}

export interface UserListItem {
    id: number;
    username: string;
    name: string;
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

async function request<T>(endpoint: string): Promise<T> {
    try {
        const opts = getCommonOpts();
        const res = await fetch(`${API_URL}${endpoint}`, opts);
        
        if (res.status === 401) {
            // Token expired, attempt to refresh
            await refreshTokenIfNeeded();
            // Retry with new token
            const newOpts = getCommonOpts();
            const newRes = await fetch(`${API_URL}${endpoint}`, newOpts);
            
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

export const getMe = (): Promise<UserData> => request<UserData>("users/me/");
export const getTransactions = (): Promise<Transaction[]> => request<Transaction[]>("transactions/");
export const getStatistics = (): Promise<Statistics> => request<Statistics>("statistics/");
export const getUsers = (): Promise<UserListItem[]> => request<UserListItem[]>("users/");
export const getUserById = (id: number): Promise<UserData> => request<UserData>(`users/${id}/`);
