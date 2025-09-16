export default async function handler(req, res) {
  // Falls du die Env nicht setzt, greifen diese Defaults und es läuft trotzdem.
  const host = process.env.BEDROCK_HOST || "important-instrumentation.gl.at.ply.gg";
  const port = parseInt(process.env.BEDROCK_PORT || "18232", 10);

  async function probe() {
    try {
      const r = await fetch(`https://api.mcstatus.io/v2/status/bedrock/${host}:${port}`, { cache: "no-store" });
      if (r.ok) {
        const j = await r.json();
        if (typeof j.online === "boolean") return j.online;
      }
    } catch {}
    try {
      const r = await fetch(`https://api.mcsrvstat.us/bedrock/2/${host}:${port}`, { cache: "no-store" });
      if (r.ok) {
        const j = await r.json();
        if (typeof j.online === "boolean") return j.online;
      }
    } catch {}
    return null;
  }

  const ok = await probe();
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.status(200).json({
    generated: new Date().toISOString(),
    service: { name: "Minecraft Bedrock", host, port },
    ok
  });
}
