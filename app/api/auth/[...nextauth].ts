import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { fetchApiData } from "services/Ent";
import Endpoints from "config/endpoints";
import { OTP_MEMBER_LENGTH } from "../../../config";
import { StatusEnum } from "libs/StatusEnum";

// For more information on each option (and a full list of options) go to
// https://next-auth.js.org/configuration/options

// async function refreshAccessToken(tokenObject: JWT) {
//   try {
//     // Get a new set of tokens with a refreshToken
//     const tokenResponse = await axios.post(process.env.BASE_API + EntApiEndpoints.REFRESH_TOKEN, {
//       token: tokenObject.refreshToken,
//     });
//     return {
//       ...tokenObject,
//       accessToken: tokenResponse.data.accessToken,
//       accessTokenExpires: tokenResponse.data.accessTokenExpires,
//       refreshToken: tokenResponse.data.refreshToken,
//     };
//   } catch (error) {
//     return {
//       ...tokenObject,
//       error: 'RefreshAccessTokenError',
//     };
//   }
// }
//

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: "/auth/login",
    error: "/auth/login", // Error code passed in query string as ?error=
    verifyRequest: "/auth/verify-request", // (used for check email message)
    newUser: "/auth/register",
  },
  providers: [
    CredentialsProvider({
      id: "account-login",
      name: "Account Login",
      credentials: {
        phone: { label: "Phone", type: "text" },
        password: { label: "Password", type: "password" },
      },
      // @ts-ignore
      async authorize(credentials) {
        const { phone, password } = credentials ?? {};
        if (!password || password.length < 8) {
          throw new Error("Otp wrong");
        }
        if (
          typeof phone === "undefined" ||
          phone === null ||
          phone === "" ||
          !/(84|0[35789])+(\d{8})\b/.test(phone.toString())
        ) {
          throw new Error("Missing username or password");
        }
        const params = {
          phone: phone,
          password: password,
        };
        try {
          const { success, data, message } = await fetchApiData(
            Endpoints.LOGIN,
            {
              method: "post",
              data: params,
            },
          );
          if (!success) {
            return Promise.reject({
              message: data.message || message,
              status: false,
            });
          }
          return data;
        } catch (e: any) {
          return new Error(e.message);
        }
      },
    }),
  ],
  //:
  callbacks: {
    async signIn({ user }) {
      return !!user;
    },
    jwt: async ({ token, user }) => {
      if (user) {
        // @ts-ignore
        token.user = user;
      }
      return token;
    },
    session: async ({ session, token }) => {
      //console.log(token.user?.account?.role);
      // console.log('userData', token);
      // Here we pass accessToken to the client to be used in authentication with your API
      if (token.user) {
        session.user = { ...(token.user?.account || null) };
        session.member = token.user.member || null;
        session.members = token.user.members || null;
        // @ts-ignore
        session.accessToken = token.user.member_token;
        session.account_token = token.user.account_token || "";
        session.member_token = token.user.member_token;
        if (!session.member) {
          session.member =
            session.members.find(
              (member) => member.is_main === StatusEnum.ON,
            ) || null;
        }
        // @ts-ignore
        session.error = token.error;
      }
      return Promise.resolve(session);
    },
  },

  // callbacks: {
  //   jwt: async ({ token, user,account }) => {
  //     if (account && user) {
  //       return {
  //         accessToken: account.accessToken,
  //         accessTokenExpires: Date.now() + account.expires_in * 1000,
  //         refreshToken: account.refresh_token,
  //         user,
  //       }
  //     }
  //
  //
  //     // If accessTokenExpires is 24 hours, we have to refresh token before 24 hours pass.
  //     const shouldRefreshTime = Math.round((token.accessTokenExpires - 60 * 60 * 1000) - Date.now());
  //     // If the token is still valid, just return it.
  //     if (shouldRefreshTime > 0) {
  //       return Promise.resolve(token);
  //     }
  //
  //     // If the call arrives after 23 hours have passed, we allow to refresh the token.
  //     token = refreshAccessToken(token);
  //     console.log('11111111', await token);
  //     return Promise.resolve(token);
  //   },
  //   session: async ({ session, token }) => {
  //     // Here we pass accessToken to the client to be used in authentication with your API
  //     if (token) {
  //       session.user = token.user
  //       session.accessToken = token.accessToken
  //       session.error = token.error
  //     }
  //     session.deviceId = token.deviceId;
  //     return Promise.resolve(session);
  //   },
  // },
};

export default NextAuth(authOptions);
