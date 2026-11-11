import { wxRoute } from "../../lib/wx_route.mjs";
export const onRequestGet = ({ request, env }) => wxRoute("taf", request, env);
