---
title: "Chunk to the consumer, encode at the edge"
description: "How GPU, CPU and proximity chunking connect to Base64 SWF dynamic loading, Kubernetes manifests and YAML front matter, and what each reader of a data load (person, agent, machine) actually needs. Covers UTF-8 vs ASCII, SWF, GLB and Rust binaries, SVG CDATA and KML location data, bandwidth allocation for business readers, use after free in plain terms, and the hotel version: chunks that carry their own key through every door."
canonical: https://persephonepunch.github.io/crm-sync-setup/chunk-encode-load.html
category: "Specs"
date: 2026-11-25
source: https://github.com/persephonepunch/crm-sync-setup/blob/master/CHUNK-ENCODE-LOAD.md
licence: CC-BY-4.0
tags:
  - data
  - architecture
  - security
  - kubernetes
  - agents
keywords:
  - data chunking
  - GPU CPU proximity
  - Base64
  - UTF-8 vs ASCII
  - SWF loadBytes
  - GLB glTF
  - Kubernetes ConfigMap
  - YAML front matter
  - SVG CDATA
  - KML location data
  - bandwidth allocation
  - use after free
  - pointer hijack
---
# Chunk to the consumer, encode at the edge

> Data is cut into pieces sized for whatever reads it next, wrapped in text only where a system can't carry raw files, labelled so software and AI agents know what each piece is, and sent down connections that have room reserved for the work that matters most.

**Audience** Platform engineer, agent builder, data team, business reader (see Bandwidth)
**Status** Current · Version 1.0
**Owner** Platform engineer (role)

---

## Encoding Data

Two ways to turn an image into text. One shows what it looks like; the other carries its exact bytes.

|  | ASCII / UTF-8 art | Base64 |
|----|----|----|
| What it encodes | How the image looks | The image file's exact bytes |
| Method | Downsample → luminance → map each cell to a character ramp (`@%#*+=-:.`) | Every 3 bytes → 4 ASCII characters (`A–Z a–z 0–9 + /`) |
| Character set | ASCII ramp, or UTF-8 blocks `█▓▒░`, half-blocks `▀▄`, Braille `⠿` | Pure ASCII (always valid UTF-8) |
| Size | Much smaller than the image | About 33% larger than the original file |
| Reversible? | No. Lossy, a visual approximation only | Yes. Decodes to the identical file |
| Color | Grayscale, or color via ANSI 24-bit codes | Whatever the original file holds (full bit depth kept) |
| Use for | Terminals, logs, previews, stylized output | JSON payloads, HTML/CSS `data:` URIs, APIs, email |

**Takeaway:** use ASCII/UTF-8 art when a human should see the render as text. Use Base64 when a machine has to transport the render as text and rebuild it exactly.

|  | Format | Text appears where |
|----|----|----|
| Render (PNG/EXR) | Binary pixel data | Base64 for transport, ASCII art for preview |
| SWF | Binary tagged container | UTF-8 strings inside, Base64 when embedded in HTML/JSON |
| Rust binary | Native machine code / WASM | `String` = UTF-8 enforced; bytes kept separate in `Vec<u8>` |

The binary formats hold the real data. UTF-8 and Base64 are only the adapters for moving it across text-only boundaries. Everything below follows from that one rule.

## UTF-8 is global, ASCII is English only

ASCII is a 7-bit code with 128 characters: the English alphabet, digits, punctuation and control codes. It has no letters for Korean, Arabic, Greek, accented Latin or emoji. UTF-8 encodes every Unicode character in 1 to 4 bytes, and its first 128 characters are byte-for-byte identical to ASCII. That compatibility is why UTF-8 became the default for the web, JSON, YAML and Rust strings.

|  | ASCII | UTF-8 |
|----|----|----|
| Coverage | 128 characters, English only | All of Unicode, every script |
| Bytes per character | 1 (7 bits used) | 1 to 4, variable |
| Compatibility | A subset of UTF-8 | Any ASCII file is already valid UTF-8 |
| Where it still matters | Base64 alphabet, HTTP header names, hostnames, protocol keywords | Content: names, addresses, product copy, chat, front matter values |

| Character | Unicode | UTF-8 bytes | Count             |
|-----------|---------|-------------|-------------------|
| A         | U+0041  | 41          | 1 (same as ASCII) |
| é         | U+00E9  | C3 A9       | 2                 |
| 한        | U+D55C  | ED 95 9C    | 3                 |
| 😀        | U+1F600 | F0 9F 98 80 | 4                 |

Two consequences for data loads:

**Chunk boundaries.** A byte-count chunker can cut a 3-byte Korean character in half, and both halves become invalid UTF-8. Split text on character boundaries (in Rust, `str::is_char_boundary`) and Base64 on multiples of 3 input bytes, so each chunk decodes on its own.

**Size and tokens.** The same sentence costs more bytes in Korean or Hindi than in English, and language-model tokenizers usually spend more tokens on it too. Budget chunk sizes in bytes for machines and in tokens for agents; the two counts differ most for non-English text.

## How SWF, GLB and Rust binaries fit

All of them sit on the same axis: raw binary bytes versus a text representation of them. SWF, GLB and Rust binaries are on the binary side, and both have natural places where Base64 or UTF-8 come in.

### SWF (Flash)

A binary container. The header signature is `FWS` (uncompressed), `CWS` (zlib) or `ZWS` (LZMA), followed by tagged records. Vectors are compact bit-packed shape records, which is why Flash files were small. Bitmaps live in `DefineBitsJPEG*` and `DefineBitsLossless*` tags, ActionScript 3 bytecode in `DoABC` tags, and text from SWF 6 onward is UTF-8. SWFs often travelled through text-only systems as Base64, for example `data:application/x-shockwave-flash;base64,…`, and decoded back to the identical file.

### GLB (binary glTF, 3D)

The binary form of glTF 2.0, the 3D render format. A 12-byte header (magic `glTF`, version 2, total length) is followed by a `JSON` chunk that describes the scene (nodes, meshes, materials, accessors) and an optional `BIN` chunk of raw vertex, index, animation and texture bytes. Both chunks are padded to 4-byte boundaries so they can be read straight into typed arrays. Its sibling, `.gltf`, is the text form: the same JSON with buffers either in separate `.bin` files or inlined as `data:application/octet-stream;base64,…`, which costs the usual 33%.

GLB is the clearest example of the article's pattern: a small text header that people and agents can read, then bytes laid out for the GPU. Each `bufferView` maps to a vertex or index buffer that is uploaded as is (`gl.bufferData`, WebGPU `queue.writeBuffer`), and accessors give the stride and component type so no parsing is needed. Draco and meshopt extensions compress the BIN chunk; KTX2 textures stay compressed on the GPU.

### Rust binaries

Native machine code (ELF, PE or Mach-O) or a `.wasm` module. The type system keeps text and bytes apart: `String` and `&str` are guaranteed UTF-8, while images and tensors live in `Vec<u8>` or `&[u8]`. `include_bytes!` bakes raw bytes into the binary with no Base64, the `base64` crate encodes bytes for JSON, and `serde` with `bincode` covers compact binary serialization.

**Where they meet:** Ruffle, the main Flash Player emulator, is written in Rust and compiled to WebAssembly. It parses SWF tags, decompresses the zlib or LZMA payload, decodes bitmaps, runs AS3 bytecode and renders through WebGL or wgpu. Text encodings appear only at its edges. The same Rust-to-WASM route renders GLB too, through Bevy or three-d on wgpu.

## From chunk to inference

[![Data loads: from chunk to inference. Five stages (chunk by consumer, encode at the edge, load dynamically, orchestrate in YAML, infer by reader) with the hotel version underneath: suitcase, luggage tag, door, keycard, checkout](https://crm-sync.dev/kb/media/docs/data-loads-chain.svg)](https://crm-sync.dev/kb/media/docs/data-loads-chain.svg)

Download: [SVG](https://crm-sync.dev/kb/media/docs/data-loads-chain.svg) · [PNG](https://crm-sync.dev/kb/media/docs/data-loads-chain.png)

Figure 1. Five stages. Each column's three rows line up with the matching rows in the next. The pink row underneath is the hotel version of the same chain. Scroll sideways on a phone.

## Chunk by consumer: CPU, GPU, proximity

A chunk is the right size when it matches the natural unit of whatever reads it next. Sizes picked to suit the sender waste cache, memory bandwidth or network round trips on the receiving side.

| Consumer | Natural unit | Chunking rule |
|----|----|----|
| CPU | 64-byte cache line on most x86 and Arm cores (128 bytes on Apple M-series); SIMD registers of 16 to 64 bytes | Align buffers to the cache line; size working chunks to fit L2 so a loop never waits on main memory |
| GPU | A warp of 32 threads (NVIDIA); global memory served in 32-byte sectors of 128-byte lines; KV cache pages (vLLM's default block is 16 tokens) | Lay data out so neighbouring threads read neighbouring addresses (coalescing); batch requests so a whole warp works on one tile |
| Proximity | NUMA node, rack, availability zone, edge location | Move compute to the chunk: schedule the job where the bytes already are, and cross a zone or region only once per chunk |

## Dynamic load: Base64 SWF then, WASM now

Dynamic loading means receiving code or assets as bytes at runtime and turning them into something that runs. Flash did it with `Loader.loadBytes`, which accepts a `ByteArray`. When the only channel was text (HTML, XML, a JSON response), the SWF arrived as Base64 and was decoded first.

    // ActionScript 3 (Flex SDK)
    var dec:Base64Decoder = new Base64Decoder();
    dec.decode(swfBase64);                 // text in
    var bytes:ByteArray = dec.toByteArray(); // exact SWF bytes out
    new Loader().loadBytes(bytes);         // FWS / CWS / ZWS parsed and run

Flash reached end of life on 31 December 2020. The same pattern lives on with WebAssembly, and it no longer needs Base64 because `fetch` returns binary directly:

    // Browser, today
    const bytes = await (await fetch("/model-runtime.wasm")).arrayBuffer();
    const { instance } = await WebAssembly.instantiate(bytes);
    // Only inline it as Base64 when the channel is text-only (a data: URI, a JSON field)

3D follows the same path. Flash had Stage3D; today a GLB is fetched as bytes and its BIN chunk goes straight to GPU buffers:

    // Read a GLB header and chunks (little-endian uint32s)
    const buf = await (await fetch("/chair.glb")).arrayBuffer();
    const v = new DataView(buf);
    // v.getUint32(0) = 0x46546C67 "glTF", (4) = 2, (8) = total length
    const jsonLen = v.getUint32(12, true);               // chunk 0 type "JSON"
    const gltf = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 20, jsonLen)));
    const bin = new Uint8Array(buf, 20 + jsonLen + 8);    // chunk 1 type "BIN\0"
    // gltf.bufferViews[i] = { byteOffset, byteLength } into bin, uploaded to the GPU as is

## Kubernetes manifests and YAML front matter

Kubernetes is configured in YAML, which is text, so binary values inside a manifest are Base64. A Secret's `data` field and a ConfigMap's `binaryData` field both hold Base64 strings, and each object is limited to 1 MiB. Base64 there is an encoding, not protection: anyone who can read the object can decode it.

    apiVersion: v1
    kind: ConfigMap
    metadata:
      name: tokenizer-assets
    binaryData:
      merges.bin: AAECAwQFBgc...      # Base64; keep it small (1 MiB per object)
    ---
    apiVersion: v1
    kind: Pod
    metadata:
      name: inference
    spec:
      affinity:
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
            - matchExpressions:
              - key: topology.kubernetes.io/zone
                operator: In
                values: ["us-east-1a"]   # same zone as the weights bucket
      containers:
      - name: model
        image: registry.example.com/llm-server:1.4.2
        resources:
          limits:
            nvidia.com/gpu: 1            # via the NVIDIA device plugin

Model weights do not belong in a ConfigMap. Mount them from a volume in the same zone and let the kubelet's Topology Manager (policy `single-numa-node`) keep the GPU, CPUs and memory on one NUMA node. That is proximity chunking expressed as configuration.

### YAML front matter for every chunk

Front matter is the `---`-fenced YAML block at the top of a Markdown or data file, the same convention 11ty, Jekyll and Hugo use. Put one on every chunk and it becomes the chunk's manifest: what it is, how it's encoded, how to verify it, where it sits in the whole.

    ---
    id: render-0412
    encoding: base64          # or: binary, utf-8
    media_type: image/png
    bytes: 182044             # decoded size
    sha256: 9f2c…e41a
    chunk: 3
    of: 8
    locale: ko-KR             # UTF-8 content; never split mid-character
    placement: us-east-1a     # proximity hint for the scheduler
    summary: Front elevation render, 2048 px, sRGB
    ---
    iVBORw0KGgoAAAANSUhEUgAA…

YAML can also carry bytes itself with the `!!binary` tag, whose value is Base64. The same layout shows up in `safetensors` model files: an 8-byte length, a JSON header that describes every tensor, then the raw bytes, which can be memory-mapped without parsing.

### SVG with CDATA: the same load in a picture

An SVG is a text container built the same way. The XML elements describe the drawing, the way front matter describes a chunk, and `<![CDATA[ … ]]>` sections carry payloads the XML parser passes through untouched: JavaScript in `<script>`, CSS in `<style>`, or a JSON block. Binary has to be Base64 here too, because CDATA is still text: it must be valid UTF-8 and cannot contain `]]>`. Images go in as `data:image/png;base64,…`.

    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200">
      <metadata><![CDATA[ {"id":"chunk-03","encoding":"base64","sha256":"…"} ]]></metadata>
      <style><![CDATA[ .card { fill: #fff; stroke: #0a0a0a } ]]></style>
      <image href="data:image/png;base64,iVBORw0KGgo…" width="120" height="80"/>
      <script><![CDATA[ if (a < b && c) { /* runs when opened directly or inline */ } ]]></script>
    </svg>

Side by side, they are one pattern: a readable description, then a payload.

| Container | Description (text) | Payload | Binary inside |
|----|----|----|----|
| Markdown chunk | YAML front matter between `---` | Body text | Base64 or a link |
| JS module | `import` lines, exports | Code, JSON | `ArrayBuffer` via fetch |
| SVG | XML elements, `<metadata>` | CDATA script, style, JSON | Base64 `data:` URIs |
| KML | XML `Placemark`, `ExtendedData` | Coordinates, CDATA HTML in `description` | Zipped as KMZ |
| GLB | JSON chunk | BIN chunk | Raw, 4-byte aligned |
| safetensors | JSON header | Tensors | Raw, memory-mapped |

**Load rule.** An SVG with a CDATA script is code, the same risk as `Loader.loadBytes`. Browsers run it when the SVG is opened directly or inlined in HTML, and not when it is used through `<img>` or CSS `background-image`. Treat uploaded SVGs like uploaded JavaScript: sanitize them or serve them only through `<img>`.

### KML: location data in the same shape

KML (Keyhole Markup Language, an OGC standard since 2008) is XML for places, the format behind Google Earth and My Maps. Like SVG it is a text description with CDATA payloads, but its coordinates are on the Earth instead of a canvas: `longitude,latitude[,altitude]` in WGS84 degrees, longitude first. `Placemark` holds a `Point`, `LineString` or `Polygon`; `ExtendedData` carries typed key-value fields, much like front matter; and `description` often holds HTML inside CDATA for the map balloon. KMZ is the binary form: a ZIP of `doc.kml` plus icons, overlays and 3D models (often COLLADA or glTF).

    <kml xmlns="http://www.opengis.net/kml/2.2">
      <Placemark id="chunk-03">
        <name>edge-pop-sjc</name>
        <ExtendedData>
          <Data name="zone"><value>us-west1-b</value></Data>
          <Data name="sha256"><value>…</value></Data>
        </ExtendedData>
        <description><![CDATA[ <b>8 chunks</b>, 3 of 8 cached here ]]></description>
        <Point><coordinates>-121.89,37.34,0</coordinates></Point>
      </Placemark>
    </kml>

**Where it joins the chain.** Location is what proximity chunking is keyed on. Kubernetes labels such as `topology.kubernetes.io/zone` name a place without saying where it is; KML (or GeoJSON, RFC 7946, which uses the same longitude-first order) is how you draw and query those places. For chunking, points are usually bucketed into map tiles, geohashes or H3 cells so that nearby data lands in the same chunk, and large layers move to binary vector tiles (Mapbox Vector Tile, protobuf) rather than staying as XML text.

**Privacy.** A device's or person's coordinates are personal data under GDPR and most US state privacy laws, and precise geolocation is a sensitive category in several of them. Round or bucket coordinates before they leave the edge, keep exact points out of agent prompts, and record consent before collecting them.

## Inference: who reads what

A data load has three kinds of reader, and each needs a different slice of the same chunk.

| Reader | Needs | Give it | Avoid |
|----|----|----|----|
| Person | To see what it is | A render or preview: ASCII ramp or UTF-8 block art in a terminal, a thumbnail on a page | Raw Base64 |
| Agent | To decide what to do with it | The front matter and summary, plus a URI and a SHA-256 to fetch and verify the bytes when a tool needs them | Base64 in the prompt. It spends many tokens and tells a language model nothing |
| Machine | To rebuild it exactly | The bytes, chunk-aligned to its unit, checked against the hash; binary on the wire, Base64 only through text-only channels | Lossy previews; chunks split mid-character or mid-tensor |

## Size limits that set chunk sizes

Most chunk sizes are decided by the pipe, not the data. These are the common ceilings:

| Path | Limit or unit | What it means for chunks |
|----|----|----|
| Kubernetes object | 1 MiB per ConfigMap or Secret | Config and small assets only; Base64 inflates by a third, so about 750 KB of real bytes |
| gRPC | 4 MB default maximum received message | Stream larger loads as a sequence of chunk messages |
| S3 multipart upload | Parts of 5 MiB to 5 GiB, up to 10,000 parts | Upload chunks in parallel; retry only the part that failed |
| HTTP range requests | `Range: bytes=start-end` | Fetch only the chunk a reader needs; resume broken downloads |
| Base64 in JSON or YAML | +33% size, plus parse time | Fine for kilobytes; for megabytes, send a URI and a hash instead |

## Bandwidth and allocation: sharing the pipes

Think of every data connection as a road. Bandwidth is how many lanes it has; allocation is who gets which lanes and when.

A company's data travels over a handful of shared pipes: the link between offices and the cloud, the network inside a data center, and the connection out to customers. Each has a fixed width, and every system competes for it: the website and checkout, AI agents answering questions, nightly backups, and large model or video downloads. Without a plan, a single big transfer can fill the road and slow down the work customers can see. Allocation fixes that by reserving lanes for what earns money or serves customers right now, and moving bulk work to quieter hours or a separate route. Chunking is what makes this sharing fair: data sent in small, labelled pieces can be paused, resumed and interleaved with other traffic instead of blocking the road until it finishes. It also controls cost, because cloud providers charge for data leaving their network (egress), so keeping work close to where the data already sits, as the proximity section describes, cuts both delay and the bill.

| Lane | Typical traffic | How to allocate |
|----|----|----|
| Priority | Checkout, sign-in, live AI answers, customer pages | Reserved capacity at all times; small chunks; never waits behind bulk work |
| Standard | Catalog syncs, reports, agent research, product images | Shares what is left; throttled if priority traffic needs room |
| Bulk | Backups, model downloads, video, archive moves | Scheduled off-peak or on a separate link; large resumable chunks; capped so it can't fill the pipe |

**Questions to ask a vendor or team:** Which traffic is reserved, and how much? What happens to checkout when a backup runs? What do we pay per gigabyte leaving the cloud, and which transfers drive it? Can a failed transfer resume from the last chunk, or does it start over?

### When an allocation outlives its use: the "use after free" gap

In software, **use after free** is a classic security bug: a program hands a piece of memory back, but something still points to it. Whoever gets that memory next can read or change what the old pointer sees. The business version is the same mistake at a larger scale: capacity, access or an address is set up for a job, the job ends or never starts, and the setup stays live. Nobody is watching it, so nobody notices when someone else starts using it.

There are two forms. **Dangling:** the resource is released but a pointer to it remains, such as a company subdomain still pointing at a cloud storage bucket or server that was deleted. Anyone who claims that name at the cloud provider now serves content on your domain; this is called subdomain takeover. **Idle:** the resource is still allocated but unused, such as a reserved network lane, an open firewall rule or an API key for a finished project. Unused access is unmonitored access, and it is what attackers look for first.

| Allocation | Left behind | What can go wrong | Close it by |
|----|----|----|----|
| Memory (code) | Pointer to freed memory | Data leak or code execution | Memory-safe languages such as Rust, whose ownership rules reject this at compile time |
| DNS record | Subdomain pointing at a deleted bucket or app | Someone else serves pages, or collects logins, on your domain | Delete the record *before* deleting the resource |
| API key or token | Key for a finished project or a departed vendor | Quiet access to data nobody is watching | Short expiry by default; revoke on hand-off |
| Firewall rule or open port | Opening for a test or a past partner | A way in that no one remembers | Rules with an owner and an end date |
| Reserved bandwidth lane | Priority capacity for a retired service | Other traffic can use the trusted lane, and the reservation goes unmonitored | Review reservations with the services that use them |
| Kubernetes Secret or service account | Credentials still mounted after the job moved | Any pod with that account can still reach the data | Remove the account and the Secret with the workload |

**The order matters.** Release in reverse: first remove every pointer to a resource (DNS records, links, keys, rules), then free the resource itself. Doing it the other way round leaves a window in which the name still works but the thing behind it can be claimed by someone else. Give every allocation an owner and an end date, list what is allocated but idle each month, and treat "set up and never used" as a finding, not a spare.

### The hotel version: use after free, double free and pointer hijack

Picture memory as a hotel. Rooms are memory, a **pointer** is a keycard or a room number on a note (it says where something is), **allocate** is checking in, and **free** is checking out so the hotel can give the room to someone else.

**Use after free.** You check out of room 412 but keep the keycard, and it still works. Later you walk back in and treat everything there as yours, but a new guest has the room. Reading means you see their things (a data leak); writing means you leave notes they will trust (corrupted data). An attacker's trick is to arrange to be the next guest, fill 412 with their own things, and wait for the program to walk back in with its old card.

**Double free.** You check out of 412, then check out again. The front desk now lists 412 as free twice and gives it to two new guests, who overwrite each other. Worse, the hotel keeps its list of free rooms inside the empty rooms, so a broken list can trick the front desk into handing out a "room" that is really its own ledger. From there an attacker can write almost anywhere.

**Pointer hijack.** This is the payoff, not a separate bug. Programs store addresses of data and also of code: "when done, go to X", "to print, call Y". If an attacker overwrites one, the program goes where they point it. It is like swapping the lobby sign "Conference → room 900" so it points to the attacker's room. Use after free and double free (and buffer overflows) are how an attacker gets close enough to swap the sign.

    bug (use after free, double free, buffer overflow)
      → attacker controls memory the program still trusts
      → attacker overwrites a stored address
      → program jumps where the attacker chose   = hijack

|  | In memory | In the hotel | In the business |
|----|----|----|----|
| Use after free | Old pointer used after the memory was given back | Old keycard opens a room that is now someone else's | DNS record still points at a deleted bucket or app |
| Double free | Memory given back twice, so handed out twice | One room booked to two guests; the front desk's records break | The same IP address, bucket name or account assigned to two owners |
| Pointer hijack | Stored address overwritten; the program jumps where the attacker chose | The lobby sign is swapped to point to the wrong room | Subdomain takeover: customers follow your link to the attacker's site |

**Defences.** Rust's ownership rules stop the first two at compile time: each piece of memory has one owner, it is freed exactly once, and no keycard can outlive the stay. In C, set the pointer to null after freeing. Hardened allocators catch double frees, pointer authentication on Apple M-series and newer Arm chips signs stored addresses so a swapped sign fails the check, and address randomization (ASLR) makes the attacker guess where the rooms are.

### Chunks through the door: key data for every piece

The same hotel explains how chunks should travel. Every place a chunk passes is a **door**: a gateway, an API, a Kubernetes ingress, an agent's tool call, a storage bucket. Every chunk should carry its own **key data**, written in its front matter, and every door should check it. A good keycard opens one room, for one guest, for the length of one stay; a good chunk key works the same way.

| Keycard rule | Chunk key field | What the door checks |
|----|----|----|
| Opens one room | `aud`: the one service allowed to read it | "Is this chunk meant for me?" If not, refuse |
| Belongs to one guest | `sub` and `scope`: who sent it and what they may do | Read only, write, or run, and nothing more |
| Stops working at checkout | `exp`: expiry time, minutes not months | Expired keys are refused, so an old chunk cannot be replayed: no use after free |
| Used once | `nonce` or chunk id plus sequence | Has this exact key been seen before? Refuse the second use: no double free |
| Can't be forged | `sig`: a signature over all the fields above | Changed fields break the signature, so no one can repaint the room number: no pointer hijack |
| The room matches the booking | `sha256` of the chunk's bytes | The bytes that arrived are the bytes that were sent |

    ---
    id: chunk-03
    of: 8
    bytes: 1048576
    sha256: 9f2c…e41a          # the room matches the booking
    key:
      aud: inference-gpu-pool  # opens one room
      sub: catalog-sync        # one guest
      scope: read              # what the guest may do
      exp: 2026-11-25T18:15Z   # checkout time
      nonce: 7d1e…             # used once
      sig: ed25519:…           # can't be forged
    ---

**Pack a suitcase, not the wardrobe.** A guest can arrive with every piece of clothing they own, or with a change of clothes that fits in one suitcase. The suitcase is the chunk. It is sized to what the door, the room and the airline allow (the 1 MiB Kubernetes object, the 4 MB gRPC message, the GPU's memory tile), and it holds only what this stay needs. The rest of the wardrobe stays at home, in the source of truth, and the guest sends for more by reference (a link and a hash) if the stay runs long.

| Travel | Data load | Why it matters |
|----|----|----|
| Bring the whole wardrobe | Send the full dataset in one load | Blocks the pipe, misses size limits, and exposes everything if one door is wrong |
| A change of clothes in one suitcase | A chunk with only the fields and rows this reader needs | Fits every limit, moves fast, and a lost suitcase loses one outfit, not the wardrobe |
| Airline baggage rules | Pipe and object size limits | Pack to the strictest limit on the route, not the most generous |
| Label on the suitcase | Front matter: id, size, hash, key | Every door can check it without opening the bag |
| Send for more clothes | Fetch the next chunk by URI and hash | The wardrobe stays home; only what is asked for travels |

Packing light is also the privacy rule: a chunk that carries only the fields its reader needs cannot leak the rest.

**What the key is not.** The key data is a signed claim, not a password. It says who may open the door and until when, and the door verifies the signature with a public key. Never put a real secret (an API key, a password, a private key) in front matter: front matter is meant to be read by people and agents, and anything written there should be safe to see. When a chunk is delivered, the stay is over: the key expires, the door forgets the nonce only after expiry, and nothing still points at the room.

## The rule

Chunk to the consumer's unit, keep bytes binary for as long as the pipe allows, encode to Base64 only at a text-only edge, keep text in UTF-8 split on character boundaries, and describe every chunk in front matter so agents read the description while machines fetch the bytes.
