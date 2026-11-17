// Thin wrapper around fetch(): adds the JWT, parses JSON and turns errors into readable messages.
const api = (() => {
  async function request(method, path, body) {
    const token = localStorage.getItem('cc_token');
    const res = await fetch('/api' + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body)
    });

    if (res.status === 401 && !path.startsWith('/auth/')) {
      if (api.onUnauthorized) api.onUnauthorized();
      throw new Error('Your session expired. Please sign in again.');
    }
    const data = res.status === 204 ? null : await res.json().catch(() => null);
    if (!res.ok) {
      if (res.status === 403) throw new Error("You don't have permission to do that.");
      throw new Error((data && data.message) || 'Something went wrong. Please try again.');
    }
    return data;
  }

  return {
    get: p => request('GET', p),
    post: (p, b) => request('POST', p, b === undefined ? {} : b),
    put: (p, b) => request('PUT', p, b),
    del: p => request('DELETE', p),
    onUnauthorized: null
  };
})();
