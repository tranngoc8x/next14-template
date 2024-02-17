import { AxiosRequestConfig } from "axios";
import axiosConfig from "config/axios.config";
import { FetchDataResponse } from "types/Axios";

const sendRequest = async (
  url: string,
  options: AxiosRequestConfig = {},
): Promise<FetchDataResponse> => {
  try {
    const response = await axiosConfig(url, options);
    return {
      success: true,
      message: "",
      data: response.data || response,
    };
  } catch (err: any) {
    const data = err?.data || {};
    console.log("fetchApiDataError", data);
    return {
      success: false,
      message: data?.message || err.message,
      ...err?.response,
      data: {
        ...data,
      },
    };
  }
};
export default sendRequest;
