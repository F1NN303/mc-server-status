export default async function handler(req, res) {
  const host = process.env.BEDROCK_HOST || "important-instrumentation.gl.at.ply.gg";
  const port = parseInt(process.env.BEDROCK_PORT || "18232", 10);

  async function probe() {
    // Versuche mcstatus.io (gibt vollständige Daten)
    try {
      const r = await fetch(`https://api.mcstatus.io/v2/status/bedrock/${host}:${port}`, { 
        cache: "no-store",
        signal: AbortSignal.timeout(5000)
      });
      if (r.ok) {
        const j = await r.json();
        if (j.online !== undefined) {
          return {
            online: j.online,
            version: j.version?.name || "unknown",
            motd: j.motd?.clean || "",
            players: {
              online: j.players?.online || 0,
              max: j.players?.max || 0,
              sample: []
            }
          };
        }
      }
    } catch (err) {
      console.error("mcstatus.io failed:", err.message);
    }

    // Fallback: mcsrvstat.us
    try {
      const r = await fetch(`https://api.mcsrvstat.us/bedrock/3/${host}:${port}`, { 
        cache: "no-store",
        signal: AbortSignal.timeout(5000)
      });
      if (r.ok) {
        const j = await r.json();
        if (j.online !== undefined) {
          return {
            online: j.online,
            version: j.version || "unknown",
            motd: Array.isArray(j.motd?.clean) ? j.motd.clean.join(" ") : (j.motd || ""),
            players: {
              online: j.players?.online || 0,
              max: j.players?.max || 0,
              sample: j.players?.list || []
            }
          };
        }
      }
    } catch (err) {
      console.error("mcsrvstat.us failed:", err.message);
    }

    // Beide APIs fehlgeschlagen
    return {
      online: false,
      version: "unknown",
      motd: "",
      players: { online: 0, max: 0, sample: [] }
    };
  }

  const data = await probe();
  
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.status(200).json({
    generated: new Date().toISOString(),
    service: { name: "Minecraft Bedrock", host, port },
    ok: data.online,  // Für Backward-Compatibility
    // Vollständige Daten für den Workflow:
    online: data.online,
    version: data.version,
    motd: data.motd,
    players: data.players
  });
}
