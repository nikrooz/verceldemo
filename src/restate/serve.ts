import * as restate from "@restatedev/restate-sdk/fetch";
import { greeter } from "@/restate/greeter";

const endpoint = restate.createEndpointHandler({
  services: [greeter],
  identityKeys: ["publickeyv1_A25Cm7CqPJqoHUj8KrvSGrs6g5wE1TGY2HMBVedFd2s5"],
});

// Adapt it to Next.js route handlers
export const serve = () => {
  return {
    POST: (req: Request) => endpoint(req),
    GET: (req: Request) => endpoint(req),
  };
};
