/* Durbar — tiny front-end API client (shared by studio + guest page) */
window.api = (function () {
  'use strict';
  async function req(method, path, body) {
    const r = await fetch(path, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      credentials: 'same-origin',
      body: body ? JSON.stringify(body) : undefined,
    });
    let data = null;
    try { data = await r.json(); } catch (e) {}
    if (!r.ok) throw new Error((data && data.error) || ('Request failed (' + r.status + ')'));
    return data;
  }
  return {
    me: () => req('GET', '/api/auth/me'),
    signup: (email, password, name) => req('POST', '/api/auth/signup', { email, password, name }),
    login: (email, password) => req('POST', '/api/auth/login', { email, password }),
    logout: () => req('POST', '/api/auth/logout', {}),
    myEvents: () => req('GET', '/api/events'),
    createEvent: (state) => req('POST', '/api/events', { state }),
    getEvent: (id) => req('GET', '/api/events/' + id),
    saveEvent: (id, state) => req('PUT', '/api/events/' + id, { state }),
    getPublic: (slug) => req('GET', '/api/public/' + encodeURIComponent(slug)),
    rsvp: (slug, payload) => req('POST', '/api/public/' + encodeURIComponent(slug) + '/rsvp', payload),
    contribute: (slug, payload) => req('POST', '/api/public/' + encodeURIComponent(slug) + '/contribute', payload),
  };
})();
