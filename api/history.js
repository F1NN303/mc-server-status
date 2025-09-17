const RAW = "https://raw.githubusercontent.com/F1NN303/mc-server-status/main/data/status.json";

export default async function handler(req, res) {
  try {
    const r = await fetch(RAW + "?t=" + Date.now(), { cache: "no-store" });
    if (!r.ok) throw new Error("HTTP " + r.status);
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(await r.json());
  } catch {
    res.status(200).json({ generated:"", service:{name:"Minecraft Bedrock",host:"",port:0}, history:[] });
  }
}
