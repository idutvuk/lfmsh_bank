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
    const opts = getCommonOpts();
    const res = await fetch(`${API_URL}${endpoint}`, opts);
    if (!res.ok) {
        throw new Error(`API error ${endpoint}: ${res.status}`);
    }
    return res.json();
}

export const getMe = (): Promise<UserData> => request<UserData>("users/me/");
export const getTransactions = (): Promise<Transaction[]> => request<Transaction[]>("transactions/");
export const getStatistics = (): Promise<Statistics> => request<Statistics>("statistics/");
export const getUsers = (): Promise<UserListItem[]> => request<UserListItem[]>("users/");
