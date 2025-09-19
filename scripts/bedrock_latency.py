#!/usr/bin/env python3
# scripts/bedrock_latency.py
import os, socket, struct, time, json, statistics, random

HOST = os.environ.get("HOST", "important-instrumentation.gl.at.ply.gg")
PORT = int(os.environ.get("PORT", "18232"))
SAMPLES = int(os.environ.get("SAMPLES", "5"))
TIMEOUT = float(os.environ.get("TIMEOUT", "1.2"))

RAKNET_MAGIC = bytes.fromhex("00ffff00fefefefefdfdfdfd12345678")

def bedrock_ping_once(host, port, timeout=1.0):
    pkt = bytearray([0x01])  # unconnected ping
    now = int(time.time() * 1000)
    pkt += struct.pack(">Q", now)
    pkt += RAKNET_MAGIC
    pkt += struct.pack(">Q", random.getrandbits(64))
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.settimeout(timeout)
            t0 = time.perf_counter()
            s.sendto(pkt, (host, port))
            data, _ = s.recvfrom(2048)
            rtt_ms = int((time.perf_counter() - t0) * 1000)
            if not data or data[0] != 0x1c:  # unconnected pong
                return None
            if RAKNET_MAGIC not in data:
                return None
            return rtt_ms
    except Exception:
        return None

def main():
    vals = []
    for _ in range(SAMPLES):
        ms = bedrock_ping_once(HOST, PORT, TIMEOUT)
        vals.append(ms)
        time.sleep(0.05)
    filtered = [v for v in vals if v is not None]
    out = {
        "ts": time.strftime("%Y-%m-%dT%H:%M:%S")+"Z",
        "p50_ms": int(statistics.median(filtered)) if filtered else None,
        "p95_ms": int(sorted(filtered)[max(0, int(0.95*(len(filtered)-1)))]) if filtered else None,
        "samples": [ (v if v is not None else None) for v in vals ],
    }
    print(json.dumps(out))

if __name__ == "__main__":
    main()
