(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push(["chunks/[root-of-the-server]__90ba3615._.js",
"[externals]/node:buffer [external] (node:buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:buffer", () => require("node:buffer"));

module.exports = mod;
}),
"[externals]/node:async_hooks [external] (node:async_hooks, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:async_hooks", () => require("node:async_hooks"));

module.exports = mod;
}),
"[project]/src/lib/role.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ADMIN_ROLES",
    ()=>ADMIN_ROLES,
    "PRIMARY_PLATFORM_ROLES",
    ()=>PRIMARY_PLATFORM_ROLES,
    "STAFF_ROLES",
    ()=>STAFF_ROLES,
    "USER_ROLES",
    ()=>USER_ROLES,
    "USER_STATUSES",
    ()=>USER_STATUSES,
    "getRoleLabel",
    ()=>getRoleLabel,
    "getUserStatusLabel",
    ()=>getUserStatusLabel,
    "isActiveUserStatus",
    ()=>isActiveUserStatus,
    "isAdminRole",
    ()=>isAdminRole,
    "isApprovedProfessional",
    ()=>isApprovedProfessional,
    "isProfessionalRole",
    ()=>isProfessionalRole,
    "isRootRole",
    ()=>isRootRole,
    "isStaffRole",
    ()=>isStaffRole,
    "isTrainerRole",
    ()=>isTrainerRole,
    "isVetRole",
    ()=>isVetRole,
    "needsProfessionalApproval",
    ()=>needsProfessionalApproval
]);
const USER_ROLES = [
    "ADMIN",
    "ROOT",
    "SUPERADMIN",
    "TRAINER",
    "VET",
    "CLIENT"
];
const ADMIN_ROLES = [
    "ADMIN",
    "ROOT",
    "SUPERADMIN"
];
const STAFF_ROLES = [
    "ADMIN",
    "ROOT",
    "SUPERADMIN",
    "TRAINER",
    "VET"
];
const PRIMARY_PLATFORM_ROLES = [
    "ADMIN",
    "TRAINER",
    "VET",
    "CLIENT"
];
const USER_STATUSES = [
    "ACTIVE",
    "PENDING_APPROVAL",
    "SUSPENDED"
];
function isAdminRole(role) {
    const r = (role || "").toLowerCase();
    return r === "admin" || r === "root" || r === "superadmin";
}
function isRootRole(role) {
    const r = (role || "").toLowerCase();
    return r === "root";
}
function isTrainerRole(role) {
    const r = (role || "").toLowerCase();
    return r === "trainer";
}
function isVetRole(role) {
    const r = (role || "").toLowerCase();
    return r === "vet";
}
function isProfessionalRole(role) {
    return isTrainerRole(role) || isVetRole(role);
}
function isStaffRole(role) {
    const r = (role || "").toLowerCase();
    return isAdminRole(r) || r === "trainer" || r === "vet";
}
function isActiveUserStatus(status) {
    return String(status || "ACTIVE").toUpperCase() === "ACTIVE";
}
function needsProfessionalApproval(role, status) {
    return isProfessionalRole(role) && !isActiveUserStatus(status);
}
function isApprovedProfessional(role, status) {
    return isProfessionalRole(role) && isActiveUserStatus(status);
}
function getRoleLabel(role) {
    const r = String(role || "CLIENT").toUpperCase();
    if (r === "ROOT") return "Root";
    if (r === "SUPERADMIN") return "Superadmin";
    if (r === "ADMIN") return "Administrador";
    if (r === "TRAINER") return "Adestrador";
    if (r === "VET") return "Veterinario";
    return "Cliente";
}
function getUserStatusLabel(status, role) {
    const normalized = String(status || "ACTIVE").toUpperCase();
    if (normalized === "PENDING_APPROVAL" && isTrainerRole(role)) return "Adestrador em analise";
    if (normalized === "PENDING_APPROVAL" && isVetRole(role)) return "Veterinario em analise";
    if (normalized === "PENDING_APPROVAL") return "Em analise";
    if (normalized === "SUSPENDED") return "Suspenso";
    return "Ativo";
}
}),
"[project]/src/lib/access.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CORE_MODULES",
    ()=>CORE_MODULES,
    "PROTECTED_PAGE_PREFIXES",
    ()=>PROTECTED_PAGE_PREFIXES,
    "PUBLIC_PAGE_PREFIXES",
    ()=>PUBLIC_PAGE_PREFIXES,
    "dedupeModuleKeys",
    ()=>dedupeModuleKeys,
    "getCoreModuleDescription",
    ()=>getCoreModuleDescription,
    "getCoreModuleLabel",
    ()=>getCoreModuleLabel,
    "getRequiredModulesForPath",
    ()=>getRequiredModulesForPath,
    "getSessionModuleKeys",
    ()=>getSessionModuleKeys,
    "hasModuleAccess",
    ()=>hasModuleAccess,
    "isProtectedPath",
    ()=>isProtectedPath,
    "isPublicPath",
    ()=>isPublicPath,
    "normalizeModuleKey",
    ()=>normalizeModuleKey
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$role$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/role.ts [middleware-edge] (ecmascript)");
;
const CORE_MODULES = [
    {
        key: "DOGS",
        name: "Acompanhamento dos Caes",
        description: "Ficha, historico e dados do cao acompanhados pela equipe K9."
    },
    {
        key: "TRAINING",
        name: "Treinos Liberados",
        description: "Treinos, sessoes e progresso definidos pela equipe K9."
    },
    {
        key: "SCHEDULE",
        name: "Agenda de Acompanhamento",
        description: "Eventos e sessoes criados pelo admin para o cliente."
    },
    {
        key: "COURSES",
        name: "Cursos Liberados",
        description: "Cursos e trilhas que a equipe K9 vinculou ao cliente."
    },
    {
        key: "CONTENT_LIBRARY",
        name: "Biblioteca K9",
        description: "Materiais, guias e conteudos complementares liberados pela equipe."
    }
];
const MODULE_ROUTE_RULES = [
    {
        prefixes: [
            "/dogs",
            "/api/dogs"
        ],
        modules: [
            "DOGS"
        ]
    },
    {
        prefixes: [
            "/training",
            "/api/training"
        ],
        modules: [
            "TRAINING"
        ]
    },
    {
        prefixes: [
            "/calendar",
            "/agendamento",
            "/api/schedule"
        ],
        modules: [
            "SCHEDULE"
        ]
    },
    {
        prefixes: [
            "/courses",
            "/conteudos",
            "/api/content"
        ],
        modules: [
            "COURSES",
            "CONTENT_LIBRARY"
        ]
    }
];
const PUBLIC_PAGE_PREFIXES = [
    "/",
    "/blog",
    "/racas",
    "/login",
    "/register",
    "/unauthorized",
    "/api/auth"
];
const PROTECTED_PAGE_PREFIXES = [
    "/dashboard",
    "/profile",
    "/forum",
    "/dogs",
    "/training",
    "/calendar",
    "/agendamento",
    "/courses",
    "/conteudos",
    "/verify",
    "/api/profile",
    "/api/forum",
    "/api/dogs",
    "/api/training",
    "/api/schedule",
    "/api/content",
    "/api/me",
    "/api/verify"
];
function normalizeModuleKey(value) {
    return String(value || "").trim().replace(/\s+/g, "_").replace(/[^A-Z0-9_]/gi, "_").toUpperCase();
}
function dedupeModuleKeys(values) {
    return [
        ...new Set(values.map((value)=>normalizeModuleKey(value)).filter(Boolean))
    ];
}
function getSessionModuleKeys(modules) {
    return dedupeModuleKeys(modules || []);
}
function hasModuleAccess(moduleKeys, requiredModules, role) {
    if (!requiredModules) return true;
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$role$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["isAdminRole"])(role) || (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$role$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["isStaffRole"])(role)) return true;
    const userModules = new Set(getSessionModuleKeys(moduleKeys));
    const requiredList = Array.isArray(requiredModules) ? requiredModules : [
        requiredModules
    ];
    return requiredList.some((required)=>userModules.has(normalizeModuleKey(required)));
}
function getRequiredModulesForPath(pathname) {
    const matched = MODULE_ROUTE_RULES.find(({ prefixes })=>prefixes.some((prefix)=>pathname === prefix || pathname.startsWith(`${prefix}/`)));
    return matched?.modules || null;
}
function isPublicPath(pathname) {
    if (pathname === "/") return true;
    return PUBLIC_PAGE_PREFIXES.some((prefix)=>prefix !== "/" && (pathname === prefix || pathname.startsWith(`${prefix}/`)));
}
function isProtectedPath(pathname) {
    return PROTECTED_PAGE_PREFIXES.some((prefix)=>pathname === prefix || pathname.startsWith(`${prefix}/`));
}
function getCoreModuleLabel(key) {
    const normalized = normalizeModuleKey(key);
    return CORE_MODULES.find((item)=>item.key === normalized)?.name || normalized || "Modulo";
}
function getCoreModuleDescription(key) {
    const normalized = normalizeModuleKey(key);
    return CORE_MODULES.find((item)=>item.key === normalized)?.description || "Acesso administrado pela equipe K9.";
}
}),
"[project]/middleware.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "config",
    ()=>config,
    "middleware",
    ()=>middleware
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$api$2f$server$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/next/dist/esm/api/server.js [middleware-edge] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/esm/server/web/exports/index.js [middleware-edge] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$jwt$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next-auth/jwt/index.js [middleware-edge] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$access$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/access.ts [middleware-edge] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$role$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/role.ts [middleware-edge] (ecmascript)");
;
;
;
;
const ADMIN_PATHS = [
    "/admin",
    "/api/admin"
];
const CONTENT_SECURITY_POLICY = [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
    "connect-src 'self' https:"
].join("; ");
function matchesPrefix(path, prefixes) {
    return prefixes.some((prefix)=>path === prefix || path.startsWith(`${prefix}/`));
}
function applySecurityHeaders(response) {
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("Content-Security-Policy", CONTENT_SECURITY_POLICY);
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
    response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
    return response;
}
async function middleware(req) {
    const path = req.nextUrl.pathname;
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$access$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["isPublicPath"])(path) && !matchesPrefix(path, ADMIN_PATHS)) {
        return applySecurityHeaders(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next());
    }
    const requiresAuth = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$access$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["isProtectedPath"])(path) || matchesPrefix(path, ADMIN_PATHS);
    if (!requiresAuth) {
        return applySecurityHeaders(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next());
    }
    const token = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$jwt$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["getToken"])({
        req,
        secret: process.env.NEXTAUTH_SECRET
    });
    if (!token) {
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("next", path);
        return applySecurityHeaders(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(loginUrl));
    }
    if (token.status === "SUSPENDED") {
        const blockedUrl = new URL("/login", req.url);
        blockedUrl.searchParams.set("reason", "suspended");
        return applySecurityHeaders(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(blockedUrl));
    }
    if (matchesPrefix(path, ADMIN_PATHS) && !(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$role$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["isAdminRole"])(token.role)) {
        return applySecurityHeaders(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL("/unauthorized", req.url)));
    }
    const requiredModules = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$access$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["getRequiredModulesForPath"])(path);
    const moduleKeys = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$access$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["getSessionModuleKeys"])(token.modules || []);
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$access$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["hasModuleAccess"])(moduleKeys, requiredModules, token.role)) {
        const unauthorizedUrl = new URL("/unauthorized", req.url);
        unauthorizedUrl.searchParams.set("from", path);
        return applySecurityHeaders(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(unauthorizedUrl));
    }
    return applySecurityHeaders(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next());
}
const config = {
    matcher: [
        "/admin/:path*",
        "/dashboard/:path*",
        "/calendar/:path*",
        "/agendamento/:path*",
        "/conteudos/:path*",
        "/courses/:path*",
        "/dogs/:path*",
        "/forum/:path*",
        "/profile/:path*",
        "/training/:path*",
        "/verify/:path*",
        "/api/admin/:path*",
        "/api/content/:path*",
        "/api/dogs/:path*",
        "/api/forum/:path*",
        "/api/profile/:path*",
        "/api/schedule/:path*",
        "/api/training/:path*",
        "/api/verify/:path*"
    ]
};
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__90ba3615._.js.map