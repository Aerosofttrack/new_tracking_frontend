// services/mainApi.js
// Talks to the MAIN GPS admin backend (not the live-tracking socket backend)
// purely to resolve which device IMEIs the logged-in user is allowed to see.
// const MAIN_API_URL = 'https://gps-backend-3hl6.onrender.com/api/';
const MAIN_API_URL = process.env.REACT_APP_API_URL;


function authHeaders() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
}

// Returns:
//   null       -> no filtering needed (ADMIN, or nobody logged in via main app)
//   string[]   -> the exact list of IMEIs this user may see
export async function getAllowedImeis() {
    const userRaw = localStorage.getItem('user');
    const user = userRaw ? JSON.parse(userRaw) : null;
    if (!user) return null; // not authenticated through the main app — nothing to scope by

    if (user.role === 'ADMIN') return null; // admins see every device

    const params = new URLSearchParams({ limit: '1000' });
    if (user.role === 'DEALER') {
        params.set('dealerId', user._id);
    } else {
        // USER and SUB_USER — sub-users inherit their parent user's owned devices.
        // Adjust `parentId` here if your sub-user record names this field differently.
        const ownerId = user.role === 'SUB_USER' ? (user.parentId?._id || user.parentId) : user._id;
        if (!ownerId) return [];
        params.set('ownerUserId', ownerId);
    }

    const res = await fetch(`${MAIN_API_URL}devices?${params.toString()}`, {
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
    });
    if (!res.ok) throw new Error(`Failed to load device access list: ${res.status}`);

    const body = await res.json();
    const list = body?.data?.data || body?.data || [];
    return list.map((d) => d.imei).filter(Boolean);
}
