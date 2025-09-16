// Liefert den serverseitig gespeicherten Verlauf aus dem Repo (RAW).
export default async function handler(req, res) {
  const raw = process.env.HISTORY_RAW_URL
    || "https://raw.githubusercontent.com/F1NN303/mc-status-bedrock/main/data/status.json"; // <— anpassen (User/Repo)

  try {
    const r = await fetch(raw + "?t=" + Date.now(), { cache: "no-store" });
    if (!r.ok) throw new Error("HTTP " + r.status);
    const j = await r.json();
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(j);
  } catch (e) {
    // Fallback: leeres Schema, damit die Seite nicht crasht
    res.status(200).json({ generated: "", service: { name: "Minecraft Bedrock", host: "", port: 0 }, history: [] });
  }
}
