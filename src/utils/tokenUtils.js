export const saveToken = (token) => {
  localStorage.setItem('medibook_token', token);
};

export const getToken = () => {
  return localStorage.getItem('medibook_token');
};

export const removeToken = () => {
  localStorage.removeItem('medibook_token');
};

export const parseToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0)
          .toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

export const getUserRole = () => {
  const token = getToken();
  if (!token) return null;
  const payload = parseToken(token);
  return payload ? payload.role : null;
};

export const getUserEmail = () => {
  const token = getToken();
  if (!token) return null;
  const payload = parseToken(token);
  return payload ? payload.sub : null;
};

export const isTokenExpired = () => {
  const token = getToken();
  if (!token) return true;
  const payload = parseToken(token);
  if (!payload) return true;
  return payload.exp * 1000 < Date.now();
};
