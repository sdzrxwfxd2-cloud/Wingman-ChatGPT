import { wxRoute } from "../../lib/wx_route.mjs";
export const onRequestGet = ({ request, env }) => wxRoute("metar", request, env);
