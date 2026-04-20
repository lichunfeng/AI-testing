// main.js - Deno 原生服务器
Deno.serve((req) => {
  const url = new URL(req.url);
  
  if (url.pathname === "/") {
    return new Response("AI Testing Server is Running!", {
      headers: { "content-type": "text/plain" },
    });
  }
  
  if (url.pathname === "/api/health") {
    return new Response(JSON.stringify({ status: "ok", time: new Date().toISOString() }), {
      headers: { "content-type": "application/json" },
    });
  }
  
  return new Response("Not Found", { status: 404 });
});
