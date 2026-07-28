import type { Stats, Ticket } from "./types";

// 后端地址从环境变量读取，不写死在代码里。见 .env.local.example
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${path} 请求失败 (${res.status}): ${body}`);
  }

  return res.json() as Promise<T>;
}

export function getTickets(): Promise<Ticket[]> {
  return request<Ticket[]>("/api/tickets");
}

export function getStats(): Promise<Stats> {
  return request<Stats>("/api/stats");
}

export function confirmTicket(ticketId: string): Promise<Ticket> {
  return request<Ticket>(`/api/tickets/${ticketId}/confirm`, {
    method: "POST",
  });
}

export function adjustTicket(
  ticketId: string,
  newPriority: number,
): Promise<Ticket> {
  return request<Ticket>(`/api/tickets/${ticketId}/adjust`, {
    method: "POST",
    body: JSON.stringify({ new_priority: newPriority }),
  });
}
