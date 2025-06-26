const API_URL = import.meta.env.VITE_PUBLIC_API_URL || "http://localhost:8000/api/";

interface CommonOpts {
    headers: {
        "Content-Type": string;
        Authorization: string;
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


// src/services/api.ts
async function request<T>(endpoint: string, token: string): Promise<T> {
    const opts: CommonOpts = {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    };
    const res = await fetch(`${API_URL}${endpoint}`, opts);
    if (!res.ok) throw new Error(`API error ${endpoint}: ${res.status}`);
    return res.json();
}

export const getMe = (token: string) => request<UserData>("users/me/", token);
export const getTransactions = (token: string) => request<Transaction[]>("transactions/", token);
export const getStatistics = (token: string) => request<Statistics>("statistics/", token);

