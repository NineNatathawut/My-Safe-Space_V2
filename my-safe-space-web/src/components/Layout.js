import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "hono/jsx/jsx-runtime";
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
export default function Layout() {
    const navigate = useNavigate();
    const { isAuthenticated, logout } = useAuth();
    const handleLogout = () => {
        logout();
        navigate('/login');
    };
    return (_jsxs("div", { className: "min-h-screen bg-gray-50 flex flex-col", children: [_jsx("header", { className: "bg-white border-b p-4", children: _jsxs("div", { className: "container mx-auto max-w-5xl flex justify-between items-center", children: [_jsx(Link, { to: "/", className: "text-xl font-bold text-indigo-600 hover:text-indigo-700 transition", children: "\u0E1A\u0E49\u0E32\u0E19\u0E1E\u0E31\u0E01\u0E43\u0E08" }), _jsxs("nav", { className: "flex items-center gap-4 text-sm md:text-base", children: [_jsx(Link, { to: "/", className: "text-gray-600 hover:text-indigo-600 transition", children: "\u0E2B\u0E19\u0E49\u0E32\u0E2B\u0E25\u0E31\u0E01" }), _jsx(Link, { to: "/resources", className: "text-gray-600 hover:text-purple-600 transition", children: "\u0E17\u0E23\u0E31\u0E1E\u0E22\u0E32\u0E01\u0E23\u0E40\u0E22\u0E35\u0E22\u0E27\u0E22\u0E32\u0E43\u0E08" }), isAuthenticated ? (_jsxs(_Fragment, { children: [_jsx(Link, { to: "/profile", className: "text-gray-600 hover:text-indigo-600 transition", children: "\u0E42\u0E1B\u0E23\u0E44\u0E1F\u0E25\u0E4C" }), _jsx("button", { onClick: handleLogout, className: "text-red-500 hover:text-red-700 transition ml-2", children: "\u0E2D\u0E2D\u0E01\u0E08\u0E32\u0E01\u0E23\u0E30\u0E1A\u0E1A" })] })) : (_jsx(_Fragment, { children: _jsx(Link, { to: "/login", className: "bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full font-medium hover:bg-indigo-100 transition ml-2", children: "\u0E40\u0E02\u0E49\u0E32\u0E2A\u0E39\u0E48\u0E23\u0E30\u0E1A\u0E1A" }) }))] })] }) }), _jsx("main", { className: "flex-1 container mx-auto max-w-5xl p-4 mt-4", children: _jsx(Outlet, {}) })] }));
}
