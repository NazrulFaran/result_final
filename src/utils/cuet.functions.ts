import { createServerFn } from "@tanstack/react-start";

import { loginAndFetchResults, requestCaptcha, type LoginInput } from "./cuet.server";

export const getCaptcha = createServerFn({ method: "GET" }).handler(async () => requestCaptcha());

export const loginAndFetch = createServerFn({ method: "POST" })
  .inputValidator((data: LoginInput) => {
    if (!data?.studentId || !data?.password || !data?.captcha || !data?.cookie) {
      throw new Error("Missing fields");
    }
    return data;
  })
  .handler(async ({ data }) => loginAndFetchResults(data));
