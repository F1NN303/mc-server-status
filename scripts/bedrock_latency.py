#!/usr/bin/env python3
# scripts/bedrock_latency.py
#
# Misst Bedrock-UDP-Latenz (RakNet Unconnected Ping) mehrfach und gibt
# ein JSON-Objekt mit ts, p50_ms, p95_ms und den Einzel-Samples aus.

import os, socket, struct, time, json, statistics, random

HOST = os.environ.get("HOST", "127.0.0.1")
PORT = int(os.environ.get("PORT", "19132"))
SAMPLES = int(os.environ.get("SAMPLES", "5"))
TIMEOUT = float(os.environ.get("TIMEOUT", "1.0"))

# RakNet magic (16 bytes)
RAKNET_MAGIC = bytes.fromhex("00ffff00fefefefefdfdfdfd12345678")

def bedrock_ping_once(host, port, timeout=1.0):
    """
    Sendet einen RakNet Unconnected Ping (0x01) und misst RTT in Millisekunden.
    Gibt None zurück, wenn kein gültiges Pong kam.
    """
    # Paket: 0x01 + 8B time + magic + 8B clientGuid
    # Pong beginnt mit 0x1c, enthält ebenfalls magic -> einfache Validierung
    pkt = bytearray()
    pkt.append(0x01)  # unconnected ping
    now = int(time.time() * 1000)
    pkt += struct.pack(">Q", now)  # big endian
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
            # Magic muss enthalten sein
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
        # tiny delay, um nicht in gleicher Millisekunde alles zu senden
        time.sleep(0.05)

    filtered = [v for v in vals if v is not None]
    out = {
        "ts": time.strftime("%Y-%m-%dT%H:%M:%S")+"Z",
        "p50_ms": int(statistics.median(filtered)) if filtered else None,
        "p95_ms": int(sorted(filtered)[max(0, int(0.95*(len(filtered)-1)))]) if filtered else None,
        "samples": [ (v if v is not None else None) for v in vals ],
    }
    print(json.dumps(out))  # eine Zeile JSON nach stdout

if __name__ == "__main__":
    main()
