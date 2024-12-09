"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((req, res, next) => {
    console.log(`Recebendo requisição: ${req.method} ${req.url}`);
    next();
});
async function getKeycloakConfig() {
    const response = await axios_1.default.get(`${process.env.KEYCLOAK_BASE_URL}/realms/${process.env.KEYCLOAK_REALM}/.well-known/openid-configuration`);
    console.info("Keycloak config loaded:", response.data);
    return {
        authorization_endpoint: response.data.authorization_endpoint,
        end_session_endpoint: response.data.end_session_endpoint,
        token_endpoint: response.data.token_endpoint,
    };
}
// async function getAccessToken(code: string): Promise<string> {
//   const response = await axios.post(
//     `${process.env.KEYCLOAK_BASE_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`,
//     new URLSearchParams({
//       grant_type: "authorization_code",
//       code,
//       client_id: process.env.KEYCLOAK_CLIENT_ID!,
//       client_secret: process.env.KEYCLOAK_CLIENT_SECRET!,
//       redirect_uri: process.env.KEYCLOAK_REDIRECT_URI!,
//     }).toString(),
//     { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
//   );
//   if (response.data?.access_token) {
//     return response.data.access_token;
//   } else {
//     throw new Error("Failed to get access token");
//   }
// }
app.use((0, cookie_parser_1.default)());
app.get("/", (req, res) => {
    res.send(`
    <h1>Service Provider TS - </h1>
    <div>
      <a href="/login">Login</a>
    </div>
  `);
});
app.get("/test", (req, res) => {
    console.log("Rota teste");
    res.send("Teste");
});
app.get("/login", async (req, res) => {
    const { authorization_endpoint } = await getKeycloakConfig();
    const params = new URLSearchParams({
        client_id: process.env.KEYCLOAK_CLIENT_ID,
        redirect_uri: process.env.KEYCLOAK_REDIRECT_URI,
        response_type: "code",
        scope: "openid email profile",
    });
    const redirectUrl = `${authorization_endpoint}?${params.toString()}`;
    res.redirect(redirectUrl);
});
app.get("/callback", async (req, res) => {
    const code = req.query.code;
    if (!code) {
        res.status(400).send("Não encontrado");
        return;
    }
    // const accessToken = await getAccessToken(code);
    // res.cookie("access_token", accessToken).redirect("/");
    res.send("Callback encontrado");
    return;
});
app.get("/logout", async (req, res) => {
    const { end_session_endpoint } = await getKeycloakConfig();
    const logoutUrl = new URL(end_session_endpoint);
    logoutUrl.searchParams.set("redirect_uri", process.env.APP_HOST);
    res.clearCookie("access_token").redirect(logoutUrl.toString());
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Service Provider running on port ${PORT}`);
});
