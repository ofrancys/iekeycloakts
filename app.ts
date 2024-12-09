import dotenv from "dotenv";
import express, { Request, Response, NextFunction } from "express";
import axios from "axios";
import cookieParser from "cookie-parser";

dotenv.config();

const app = express();

app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`Recebendo requisição: ${req.method} ${req.url}`);
  next();
});

interface KeycloakConfig {
  authorization_endpoint: string;
  end_session_endpoint: string;
  token_endpoint: string;
}

async function getKeycloakConfig(): Promise<KeycloakConfig> {
  const response = await axios.get<KeycloakConfig>(
    `${process.env.KEYCLOAK_BASE_URL}/realms/${process.env.KEYCLOAK_REALM}/.well-known/openid-configuration`
  );
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

app.use(cookieParser());

app.get("/", (req: Request, res: Response) => {
  res.send(`
    <h1>Service Provider TS - </h1>
    <div>
      <a href="/login">Login</a>
    </div>
  `);
});

app.get("/test", (req: Request, res: Response) => {
  console.log("Rota teste");
  res.send("Teste");
});

app.get("/login", async (req: Request, res: Response) => {
  const { authorization_endpoint } = await getKeycloakConfig();
  const params = new URLSearchParams({
    client_id: process.env.KEYCLOAK_CLIENT_ID!,
    redirect_uri: process.env.KEYCLOAK_REDIRECT_URI!,
    response_type: "code",
    scope: "openid email profile",
  });
  const redirectUrl = `${authorization_endpoint}?${params.toString()}`;
  res.redirect(redirectUrl);
});

app.get("/callback", async (req: Request, res: Response): Promise<void> => {
  const code = req.query.code as string | undefined;
  if (!code) {
    res.status(400).send("Não encontrado");
    return; 
  }
  // const accessToken = await getAccessToken(code);
  // res.cookie("access_token", accessToken).redirect("/");
  res.send("Callback encontrado");
  return
});

app.get("/logout", async (req: Request, res: Response) => {
  const { end_session_endpoint } = await getKeycloakConfig();
  const logoutUrl = new URL(end_session_endpoint);
  logoutUrl.searchParams.set("redirect_uri", process.env.APP_HOST!);
  res.clearCookie("access_token").redirect(logoutUrl.toString());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Service Provider running on port ${PORT}`);
});
