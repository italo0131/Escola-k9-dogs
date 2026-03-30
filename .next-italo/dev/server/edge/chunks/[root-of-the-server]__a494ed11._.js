(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push(["chunks/[root-of-the-server]__a494ed11._.js",
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
    "getRoleLabel",
    ()=>getRoleLabel,
    "isAdminRole",
    ()=>isAdminRole,
    "isProfessionalRole",
    ()=>isProfessionalRole,
    "isRootRole",
    ()=>isRootRole,
    "isStaffRole",
    ()=>isStaffRole,
    "isTrainerRole",
    ()=>isTrainerRole,
    "isVetRole",
    ()=>isVetRole
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
function getRoleLabel(role) {
    const r = String(role || "CLIENT").toUpperCase();
    if (r === "ROOT") return "Root";
    if (r === "SUPERADMIN") return "Superadmin";
    if (r === "ADMIN") return "Administrador";
    if (r === "TRAINER") return "Adestrador";
    if (r === "VET") return "Veterinario";
    return "Cliente";
}
}),
"[project]/src/lib/platform.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ACCOUNT_PLANS",
    ()=>ACCOUNT_PLANS,
    "ACCOUNT_PLAN_OPTIONS",
    ()=>ACCOUNT_PLAN_OPTIONS,
    "BLOG_POST_TYPES",
    ()=>BLOG_POST_TYPES,
    "CHANNEL_CONTENT_ACCESS",
    ()=>CHANNEL_CONTENT_ACCESS,
    "CHANNEL_CONTENT_CATEGORIES",
    ()=>CHANNEL_CONTENT_CATEGORIES,
    "CHANNEL_CONTENT_TYPES",
    ()=>CHANNEL_CONTENT_TYPES,
    "FORUM_POST_TYPES",
    ()=>FORUM_POST_TYPES,
    "FREE_PLAN_DOG_LIMIT",
    ()=>FREE_PLAN_DOG_LIMIT,
    "PAID_ACCOUNT_PLANS",
    ()=>PAID_ACCOUNT_PLANS,
    "REGISTERABLE_ROLES",
    ()=>REGISTERABLE_ROLES,
    "SCHEDULE_FORMATS",
    ()=>SCHEDULE_FORMATS,
    "TRAINING_DIFFICULTIES",
    ()=>TRAINING_DIFFICULTIES,
    "TRAINING_FOCUS_AREAS",
    ()=>TRAINING_FOCUS_AREAS,
    "getAccountPlanDescription",
    ()=>getAccountPlanDescription,
    "getAccountPlanLabel",
    ()=>getAccountPlanLabel,
    "getBlogPostTypeLabel",
    ()=>getBlogPostTypeLabel,
    "getChannelContentAccessLabel",
    ()=>getChannelContentAccessLabel,
    "getChannelContentCategoryLabel",
    ()=>getChannelContentCategoryLabel,
    "getChannelContentTypeLabel",
    ()=>getChannelContentTypeLabel,
    "getDogLimit",
    ()=>getDogLimit,
    "getForumPostTypeLabel",
    ()=>getForumPostTypeLabel,
    "getPlanStatusLabel",
    ()=>getPlanStatusLabel,
    "getPlanUpgradeReason",
    ()=>getPlanUpgradeReason,
    "getRemainingDogSlots",
    ()=>getRemainingDogSlots,
    "getScheduleFormatLabel",
    ()=>getScheduleFormatLabel,
    "getTrainingDifficultyLabel",
    ()=>getTrainingDifficultyLabel,
    "getTrainingFocusLabel",
    ()=>getTrainingFocusLabel,
    "hasPremiumPlatformAccess",
    ()=>hasPremiumPlatformAccess,
    "isPaidPlan",
    ()=>isPaidPlan
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$role$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/role.ts [middleware-edge] (ecmascript)");
;
const REGISTERABLE_ROLES = [
    "CLIENT",
    "TRAINER",
    "VET"
];
const ACCOUNT_PLANS = [
    "FREE",
    "STARTER",
    "PRO"
];
const PAID_ACCOUNT_PLANS = [
    "STARTER",
    "PRO"
];
const FREE_PLAN_DOG_LIMIT = 3;
const ACCOUNT_PLAN_OPTIONS = [
    {
        code: "FREE",
        name: "Free",
        priceLabel: "R$ 0",
        description: "Entrada pratica para estudar racas, cadastrar ate 3 caes e publicar no blog.",
        perks: [
            "Cadastro de ate 3 caes por conta",
            "Acesso completo ao blog e a area educativa de racas",
            "Perfil da conta e organizacao inicial dos caes"
        ]
    },
    {
        code: "STARTER",
        name: "Starter",
        priceLabel: "R$ 79/mes",
        description: "Libera a plataforma inteira para treino, calendario, forum, conteudo e operacao.",
        perks: [
            "Direito a tudo o que a plataforma oferece",
            "Forum, canais, conteudos, treinos, agenda e operacao completos",
            "Ideal para clientes dedicados e adestradores em atendimento ativo"
        ]
    },
    {
        code: "PRO",
        name: "Pro",
        priceLabel: "R$ 149/mes",
        description: "Acesso total com posicionamento mais premium para quem quer operar com mais autoridade.",
        perks: [
            "Direito a tudo o que a plataforma oferece",
            "Mais forca para atendimento, posicionamento e recorrencia",
            "Pensado para operacao disciplinada e experiencia de marca mais forte"
        ]
    }
];
const CHANNEL_CONTENT_TYPES = [
    "LESSON",
    "VIDEO",
    "CHECKLIST",
    "GUIDE",
    "LIVE_REPLAY"
];
const CHANNEL_CONTENT_CATEGORIES = [
    "TRILHA",
    "DICAS",
    "TECNICAS",
    "COMPORTAMENTO",
    "ROTINA",
    "SAUDE",
    "CONDICIONAMENTO"
];
const CHANNEL_CONTENT_ACCESS = [
    "FREE",
    "SUBSCRIBER"
];
const TRAINING_FOCUS_AREAS = [
    "OBEDIENCIA",
    "SOCIALIZACAO",
    "ANSIEDADE",
    "CONDUTA_EM_PASSEIO",
    "ENRIQUECIMENTO",
    "ESPORTES",
    "REABILITACAO_COMPORTAMENTAL"
];
const TRAINING_DIFFICULTIES = [
    "INICIANTE",
    "INTERMEDIARIO",
    "AVANCADO"
];
const SCHEDULE_FORMATS = [
    "PRESENTIAL",
    "ONLINE",
    "HYBRID"
];
const FORUM_POST_TYPES = [
    "POST",
    "DICA",
    "TECNICA",
    "COMPORTAMENTO",
    "EVENTO"
];
const BLOG_POST_TYPES = [
    "POST",
    "GUIA",
    "CASO_REAL",
    "EVENTO"
];
function isPaidPlan(plan) {
    const value = String(plan || "FREE").toUpperCase();
    return value === "STARTER" || value === "PRO";
}
function hasPremiumPlatformAccess(plan, role) {
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$role$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["isAdminRole"])(role)) return true;
    return isPaidPlan(plan);
}
function getDogLimit(plan, role) {
    if (hasPremiumPlatformAccess(plan, role)) return Number.POSITIVE_INFINITY;
    return FREE_PLAN_DOG_LIMIT;
}
function getRemainingDogSlots(currentDogs, plan, role) {
    const limit = getDogLimit(plan, role);
    if (!Number.isFinite(limit)) return Number.POSITIVE_INFINITY;
    return Math.max(0, limit - currentDogs);
}
function getPlanStatusLabel(status) {
    const value = String(status || "ACTIVE").toUpperCase();
    if (value === "CHECKOUT_PENDING") return "Checkout em andamento";
    if (value === "CHECKOUT_REQUIRED") return "Assinatura pendente";
    if (value === "PAST_DUE") return "Pagamento pendente";
    if (value === "CANCELED") return "Cancelado";
    return "Ativo";
}
function getAccountPlanLabel(plan) {
    const value = String(plan || "FREE").toUpperCase();
    if (value === "STARTER") return "Starter";
    if (value === "PRO") return "Pro";
    return "Free";
}
function getAccountPlanDescription(plan) {
    const value = String(plan || "FREE").toUpperCase();
    if (value === "STARTER") return "Desbloqueia toda a plataforma para treino, agenda, forum, conteudo e relacionamento.";
    if (value === "PRO") return "Direito total a tudo que a plataforma entrega, com operacao mais forte e posicionamento premium.";
    return "Ate 3 caes, blog livre e area educativa de racas para entrar no universo K9.";
}
function getPlanUpgradeReason(reason) {
    const value = String(reason || "").toLowerCase();
    if (value.includes("/forum")) return "O forum esta disponivel nos planos Starter e Pro.";
    if (value.includes("/conteudos")) return "Os conteudos dos adestradores estao disponiveis nos planos Starter e Pro.";
    if (value.includes("/training")) return "A area completa de treinos esta disponivel nos planos Starter e Pro.";
    if (value.includes("/calendar")) return "A agenda esta disponivel nos planos Starter e Pro.";
    return "Essa area esta disponivel nos planos Starter e Pro.";
}
function getScheduleFormatLabel(format) {
    const value = String(format || "PRESENTIAL").toUpperCase();
    if (value === "ONLINE") return "Online";
    if (value === "HYBRID") return "Hibrido";
    return "Presencial";
}
function getTrainingDifficultyLabel(difficulty) {
    const value = String(difficulty || "INICIANTE").toUpperCase();
    if (value === "INTERMEDIARIO") return "Intermediario";
    if (value === "AVANCADO") return "Avancado";
    return "Iniciante";
}
function getChannelContentTypeLabel(type) {
    const value = String(type || "LESSON").toUpperCase();
    if (value === "VIDEO") return "Video";
    if (value === "CHECKLIST") return "Checklist";
    if (value === "GUIDE") return "Guia";
    if (value === "LIVE_REPLAY") return "Replay";
    return "Aula";
}
function getChannelContentCategoryLabel(category) {
    const value = String(category || "TRILHA").toUpperCase();
    if (value === "DICAS") return "Dicas";
    if (value === "TECNICAS") return "Tecnicas";
    if (value === "COMPORTAMENTO") return "Comportamento";
    if (value === "ROTINA") return "Rotina";
    if (value === "SAUDE") return "Saude";
    if (value === "CONDICIONAMENTO") return "Condicionamento";
    return "Trilha";
}
function getChannelContentAccessLabel(access) {
    const value = String(access || "SUBSCRIBER").toUpperCase();
    if (value === "FREE") return "Livre";
    return "Assinantes";
}
function getTrainingFocusLabel(value) {
    return String(value || "OBEDIENCIA").toLowerCase().replace(/_/g, " ").replace(/^\w/, (char)=>char.toUpperCase());
}
function getForumPostTypeLabel(value) {
    const normalized = String(value || "POST").toUpperCase();
    if (normalized === "DICA") return "Dica";
    if (normalized === "TECNICA") return "Tecnica";
    if (normalized === "COMPORTAMENTO") return "Comportamento";
    if (normalized === "EVENTO") return "Evento";
    return "Post";
}
function getBlogPostTypeLabel(value) {
    const normalized = String(value || "POST").toUpperCase();
    if (normalized === "GUIA") return "Guia";
    if (normalized === "CASO_REAL") return "Caso real";
    if (normalized === "EVENTO") return "Evento";
    return "Post";
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
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$role$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/role.ts [middleware-edge] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$platform$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/platform.ts [middleware-edge] (ecmascript)");
;
;
;
;
const ADMIN_PATHS = [
    "/admin",
    "/api/admin"
];
const STAFF_PATHS = [
    "/forum/channels/new",
    "/conteudos/new",
    "/api/forum/channels",
    "/api/content"
];
const PREMIUM_PATHS = [
    "/forum",
    "/conteudos",
    "/training",
    "/calendar"
];
const PROTECTED_PATHS = [
    "/billing",
    "/dashboard",
    "/calendar",
    "/dogs",
    "/dogs/new",
    "/training",
    "/profile",
    "/blog/new",
    "/forum",
    "/forum/new",
    "/api/billing",
    "/api/dogs",
    "/api/training",
    "/api/schedule",
    "/api/profile",
    "/api/forum",
    "/api/content",
    "/api/verify"
];
const VERIFICATION_ALLOWED_PREFIXES = [
    "/dashboard",
    "/verify",
    "/api/verify",
    "/api/auth",
    "/logout",
    "/login",
    "/register"
];
function matchesPrefix(path, prefixes) {
    return prefixes.some((prefix)=>path === prefix || path.startsWith(`${prefix}/`));
}
function withPrivateHeaders(response) {
    response.headers.set("Cache-Control", "no-store");
    return response;
}
async function middleware(req) {
    const url = req.nextUrl;
    const path = url.pathname;
    const requiresAuth = matchesPrefix(path, ADMIN_PATHS) || matchesPrefix(path, STAFF_PATHS) || matchesPrefix(path, PROTECTED_PATHS);
    if (!requiresAuth) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
    const token = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$jwt$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["getToken"])({
        req,
        secret: process.env.NEXTAUTH_SECRET
    });
    if (!token) {
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("next", path);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(loginUrl);
    }
    if (token.status === "SUSPENDED") {
        const blockedUrl = new URL("/login", req.url);
        blockedUrl.searchParams.set("reason", "suspended");
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(blockedUrl);
    }
    if (matchesPrefix(path, ADMIN_PATHS) && !(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$role$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["isAdminRole"])(token.role)) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL("/dashboard", req.url));
    }
    if (matchesPrefix(path, STAFF_PATHS) && !(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$role$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["isAdminRole"])(token.role) && (token.role || "").toLowerCase() !== "trainer") {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL("/dashboard", req.url));
    }
    if (matchesPrefix(path, PREMIUM_PATHS) && !(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$platform$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["hasPremiumPlatformAccess"])(token.plan, token.role)) {
        const billingUrl = new URL("/billing", req.url);
        billingUrl.searchParams.set("locked", path);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(billingUrl);
    }
    // exigir email verificado para áreas sensíveis (exceto dashboard e verificação)
    const emailVerifiedAt = token.emailVerifiedAt;
    const isVerified = !!emailVerifiedAt;
    if (!isVerified && !(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$role$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["isRootRole"])(token.role)) {
        const isAllowed = matchesPrefix(path, VERIFICATION_ALLOWED_PREFIXES);
        if (!isAllowed) {
            const verifyUrl = new URL("/verify", req.url);
            verifyUrl.searchParams.set("next", path);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(verifyUrl);
        }
    }
    return withPrivateHeaders(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next());
}
const config = {
    matcher: [
        "/admin/:path*",
        "/dashboard/:path*",
        "/billing/:path*",
        "/calendar/:path*",
        "/conteudos/:path*",
        "/dogs/:path*",
        "/forum/:path*",
        "/profile/:path*",
        "/training/:path*",
        "/verify/:path*",
        "/api/admin/:path*",
        "/api/billing/:path*",
        "/api/content/:path*",
        "/api/dogs/:path*",
        "/api/forum/:path*",
        "/api/profile/:path*",
        "/api/schedule/:path*",
        "/api/training/:path*",
        "/api/verify/:path*",
        "/blog/new/:path*"
    ]
};
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__a494ed11._.js.map