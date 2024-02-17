import axios from "axios";
import Endpoints from "config/endpoints";
import { getSession } from "next-auth/react";
import Routers from "libs/routers";

const axiosConfig = axios.create({
  baseURL: Endpoints.baseApi,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json; charset=utf-8",
  },
});
async function refreshAccessToken() {
  const refreshToken = "";
  try {
    const response = await axios.post(
      `${Endpoints.baseApi}${Endpoints.refreshToken}`,
      null,
      {
        headers: {
          refreshToken,
        },
      },
    );
    return response?.data;
  } catch (err) {
    throw err;
  }
}

axiosConfig.interceptors.request.use(
  async (config) => {
    config.withCredentials = true;
    if (![Routers.login].includes(config.url!)) {
      if (!config.headers["x-access-token"]) {
        const session = await getSession();
        config.headers["x-access-token"] = session?.accessToken || "";
      }
    }
    // const token = {
    //   accessToken: 'my-access-token',
    //   refreshToken: 'my-refresh-token',
    // };
    //
    // if (token?.accessToken) {
    //   config.headers!.Authorization = `Bearer ${token?.accessToken}`;
    // }
    return config;
  },
  (error) => Promise.resolve(error),
);

axiosConfig.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;
    if (error?.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      return refreshAccessToken()
        .then((data) => {
          originalRequest.headers = {
            ...originalRequest.headers,
            Authorization: "Bearer " + data?.accessToken,
          };
          return axios(originalRequest);
        })
        .catch(() => {
          return Promise.resolve(error);
        });
    }
    return Promise.reject(error.response || error);
  },
);

export default axiosConfig;
