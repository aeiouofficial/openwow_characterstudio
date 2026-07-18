# Gear-safe body customization

## Problem

Classic characters stack **body geosets** + **armor geosets**. If you scale/morph the whole skeleton or all meshes, armor UVs stretch and item icons no longer match the 3D gear.

## Solution used here

1. **Classify every mesh node** on import:
   - `body` — Geoset0 / Torso / skin family → body morph OK
   - `head` — HeadSwap / Ears / Eyes / Hair / Facial → head morph OK
   - `gear` — Gloves, Boots, Chest, Cloak, Tabard, Belt, … → **never displaced**

2. **Body morph** is a soft spatial field on body verts only (chest, belly, shoulders, thighs, …).

3. **Gear stays at bind-pose positions** so baseColor textures render pixel-correct.

4. **External images** can still re-skin gear materials without moving verts.

## Tradeoff

At extreme body bulk, armor may float or clip slightly at seams. Mitigations:
- keep morph strengths modest for live servers
- soft falloff near shoulders/waist
- optional future: per-piece armor morph profiles (not in v1.1)
