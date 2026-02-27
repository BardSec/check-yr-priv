const BASE = "";

async function request(path, options = {}) {
  const res = await fetch(BASE + path, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (res.status === 401) {
    window.location.href = "/auth/login";
    return null;
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Request failed");
  }
  return res.json();
}

export const api = {
  me: () =>
    fetch(BASE + "/auth/me", { credentials: "include" }).then((r) => r.json()),
  logout: () => request("/auth/logout", { method: "POST" }),
  dashboard: () => request("/api/dashboard"),
};
