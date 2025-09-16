// Liefert den serverseitig gespeicherten Verlauf aus deinem Repo.
// Keine Env nötig – fest verdrahtete RAW-URL => keine "leere" Antwort mehr.
const RAW = "https://raw.githubusercontent.com/F1NN303/mc-status-bedrock/main/data/status.json";

export default async function handler(req, res) {
  try {
    const r = await fetch(RAW + "?t=" + Date.now(), { cache: "no-store" });
    if (!r.ok) throw new Error("HTTP " + r.status);
    const j = await r.json();
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(j);
  } catch (e) {
    // Fallback-Schema, damit das Frontend nicht abstürzt
    res.status(200).json({
      generated: "",
      service: { name: "Minecraft Bedrock", host: "", port: 0 },
      history: []
    });
  }
}
