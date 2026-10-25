/* ============================================================
   NYN Chatbot — Cloudflare Worker proxy.
   This runs on Cloudflare's servers, NOT in the browser. It is the
   only place the real Gemini API key is stored, so the key never
   appears in the website's code or in the GitHub repo.

   SETUP (do this once, from your phone, no app/CLI needed):
   1. Go to dash.cloudflare.com → sign up / log in (free).
   2. Left menu → "Workers & Pages" → "Create" → "Create Worker".
   3. Give it any name (e.g. "nyn-chatbot") → "Deploy" (deploys a
      starter template first — that's fine, we'll replace it).
   4. Open the Worker → "Edit code". Select ALL the existing code
      and replace it with everything in THIS file. Tap "Deploy".
   5. Go back to the Worker's "Settings" → "Variables and Secrets"
      → "Add" → name: GEMINI_API_KEY, value: your Gemini key
      (the one starting with AQ. or AIzaSy...) → mark it as
      "Secret" / encrypted → "Deploy".
   6. Copy the Worker's URL shown at the top (something like
      https://nyn-chatbot.<your-subdomain>.workers.dev) and send
      it back — that's the only thing chatbot.js needs to know.
   ============================================================ */

const GEMINI_MODEL = "gemini-flash-latest";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers: CORS_HEADERS });
    }

    if (!env.GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY is not set on this Worker." }),
        { status: 500, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid JSON body." }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }

    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/" +
      GEMINI_MODEL + ":generateContent?key=" + env.GEMINI_API_KEY;

    try {
      const geminiRes = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await geminiRes.text(); // pass through as-is
      return new Response(data, {
        status: geminiRes.status,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: String(err) }), {
        status: 502,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }
  },
};
