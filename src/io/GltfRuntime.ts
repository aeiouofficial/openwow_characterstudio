/**
 * Minimal pure-JS glTF 2.0 / GLB runtime for Character Studio (no Three.js required).
 * Loads meshes, skins, animations, textures; supports external image rebinding.
 * .bj: if file is GLB (glTF magic) or glTF JSON / zip-wrapped, loads; else clear error.
 */

export type GltfNode = {
  name: string;
  mesh?: number;
  skin?: number;
  children?: number[];
  translation?: number[];
  rotation?: number[];
  scale?: number[];
  extras?: Record<string, unknown>;
  matrix?: number[];
};

export type GltfMeshPrim = {
  attributes: Record<string, number>;
  indices?: number;
  material?: number;
  mode?: number;
};

export type GltfJson = {
  asset?: { generator?: string; extras?: Record<string, unknown> };
  scene?: number;
  scenes?: Array<{ nodes?: number[] }>;
  nodes?: GltfNode[];
  meshes?: Array<{ name?: string; primitives: GltfMeshPrim[] }>;
  accessors?: any[];
  bufferViews?: any[];
  buffers?: Array<{ byteLength: number; uri?: string }>;
  materials?: any[];
  textures?: any[];
  images?: any[];
  samplers?: any[];
  skins?: any[];
  animations?: any[];
};

export type GeosetEntry = {
  nodeIndex: number;
  name: string;
  meshIndex: number;
  material?: number;
  group: string;
  variant: number | string;
  defaultVisible: boolean;
  visible: boolean;
  isBodySafe: boolean;
  isGear: boolean;
};

export type LoadedModel = {
  json: GltfJson;
  bin: ArrayBuffer;
  geosets: GeosetEntry[];
  animations: Array<{ index: number; name: string; duration: number }>;
  materials: Array<{ index: number; name: string; baseColorTex?: number }>;
  images: Array<{ index: number; name: string; mimeType?: string; blobUrl?: string; bytes?: Uint8Array }>;
  generator?: string;
  extras?: Record<string, unknown>;
};

const CT: Record<number, { arr: any; bytes: number }> = {
  5120: { arr: Int8Array, bytes: 1 },
  5121: { arr: Uint8Array, bytes: 1 },
  5122: { arr: Int16Array, bytes: 2 },
  5123: { arr: Uint16Array, bytes: 2 },
  5125: { arr: Uint32Array, bytes: 4 },
  5126: { arr: Float32Array, bytes: 4 },
};
const NC: Record<string, number> = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };

export function readAccessor(json: GltfJson, bin: ArrayBuffer, accessorIndex: number): { data: ArrayBufferView; count: number; type: string; componentType: number } {
  const a = json.accessors![accessorIndex];
  const bv = json.bufferViews![a.bufferView];
  const meta = CT[a.componentType];
  const n = a.count * NC[a.type];
  const byteOffset = (bv.byteOffset || 0) + (a.byteOffset || 0);
  const bytes = n * meta.bytes;
  const slice = bin.slice(byteOffset, byteOffset + bytes);
  return { data: new meta.arr(slice), count: a.count, type: a.type, componentType: a.componentType };
}

function parseGeosetName(name: string): { group: string; variant: number } {
  // orcmale_hd_Hair26 / character_Hair_01 etc.
  const m = name.match(/(?:^|_)([A-Za-z]+?)(\d+)$/);
  if (m) return { group: m[1], variant: parseInt(m[2], 10) };
  const m2 = name.match(/([A-Za-z]+)[\s_-]*(\d+)/);
  if (m2) return { group: m2[1], variant: parseInt(m2[2], 10) };
  return { group: name || 'Mesh', variant: 0 };
}

import { isBodySafeGeoset, GEAR_GEOSET_GROUPS } from '../engine/BodyMorphCatalog';

export function buildGeosetList(json: GltfJson): GeosetEntry[] {
  const out: GeosetEntry[] = [];
  const nodes = json.nodes || [];
  nodes.forEach((nd, nodeIndex) => {
    if (nd.mesh == null) return;
    const name = nd.name || `node_${nodeIndex}`;
    const extras = (nd.extras || {}) as any;
    const parsed = parseGeosetName(name.replace(/^orcmale_hd_/, '').replace(/^.*_hd_/, ''));
    const group = (extras.geosetGroup as string) || parsed.group;
    const variant = extras.geosetVariant ?? parsed.variant;
    const defaultVisible = extras.defaultVisible !== undefined ? !!extras.defaultVisible : true;
    const mesh = json.meshes![nd.mesh];
    const mat = mesh.primitives[0]?.material;
    const bodySafe = isBodySafeGeoset(group, name);
    const isGear = GEAR_GEOSET_GROUPS.has(group) || (!bodySafe && !/Hair|Facial|Head|Ear|Eye/i.test(group));
    out.push({
      nodeIndex,
      name,
      meshIndex: nd.mesh,
      material: mat,
      group,
      variant,
      defaultVisible,
      visible: defaultVisible,
      isBodySafe: bodySafe,
      isGear,
    });
  });
  return out;
}

export function listAnimations(json: GltfJson): Array<{ index: number; name: string; duration: number }> {
  return (json.animations || []).map((anim: any, index: number) => {
    let duration = 0;
    for (const s of anim.samplers || []) {
      const acc = json.accessors![s.input];
      if (acc?.max?.[0] != null) duration = Math.max(duration, acc.max[0]);
    }
    return { index, name: anim.name || `Animation_${index}`, duration };
  });
}

async function imageFromBufferView(json: GltfJson, bin: ArrayBuffer, imageIndex: number): Promise<{ bytes: Uint8Array; mimeType: string; blobUrl: string; name: string }> {
  const img = json.images![imageIndex];
  const mimeType = img.mimeType || 'image/png';
  const name = img.name || `image_${imageIndex}`;
  let bytes: Uint8Array;
  if (img.bufferView != null) {
    const bv = json.bufferViews![img.bufferView];
    const o = bv.byteOffset || 0;
    bytes = new Uint8Array(bin, o, bv.byteLength);
    // copy — bin may be detached later
    bytes = bytes.slice();
  } else if (img.uri && img.uri.startsWith('data:')) {
    const b64 = img.uri.split(',')[1];
    const binStr = atob(b64);
    bytes = new Uint8Array(binStr.length);
    for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
  } else {
    bytes = new Uint8Array(0);
  }
  const blobBytes = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  const blob = new Blob([blobBytes], { type: mimeType });
  const blobUrl = URL.createObjectURL(blob);
  return { bytes, mimeType, blobUrl, name };
}

export async function parseGlb(buffer: ArrayBuffer): Promise<LoadedModel> {
  const u8 = new Uint8Array(buffer);
  const dv = new DataView(buffer);
  const magic = dv.getUint32(0, true);
  if (magic !== 0x46546c67) throw new Error('Not a GLB (missing glTF magic)');
  const version = dv.getUint32(4, true);
  if (version !== 2) throw new Error(`Unsupported GLB version ${version}`);
  let offset = 12;
  let json: GltfJson | null = null;
  let bin = new ArrayBuffer(0);
  while (offset < buffer.byteLength) {
    const len = dv.getUint32(offset, true);
    const type = dv.getUint32(offset + 4, true);
    const start = offset + 8;
    const chunk = buffer.slice(start, start + len);
    if (type === 0x4e4f534a) {
      // JSON
      const text = new TextDecoder().decode(new Uint8Array(chunk));
      json = JSON.parse(text);
    } else if (type === 0x004e4942) {
      bin = chunk;
    }
    offset = start + len;
  }
  if (!json) throw new Error('GLB missing JSON chunk');
  return finalizeModel(json, bin);
}

export async function parseGltfJson(text: string, bin?: ArrayBuffer): Promise<LoadedModel> {
  const json = JSON.parse(text) as GltfJson;
  return finalizeModel(json, bin || new ArrayBuffer(0));
}

async function finalizeModel(json: GltfJson, bin: ArrayBuffer): Promise<LoadedModel> {
  const geosets = buildGeosetList(json);
  const animations = listAnimations(json);
  const materials = (json.materials || []).map((m: any, index: number) => ({
    index,
    name: m.name || `material_${index}`,
    baseColorTex: m.pbrMetallicRoughness?.baseColorTexture?.index,
  }));
  const images: LoadedModel['images'] = [];
  for (let i = 0; i < (json.images || []).length; i++) {
    try {
      const im = await imageFromBufferView(json, bin, i);
      images.push({ index: i, name: im.name, mimeType: im.mimeType, blobUrl: im.blobUrl, bytes: im.bytes });
    } catch {
      images.push({ index: i, name: `image_${i}` });
    }
  }
  return {
    json,
    bin,
    geosets,
    animations,
    materials,
    images,
    generator: json.asset?.generator,
    extras: json.asset?.extras as Record<string, unknown> | undefined,
  };
}

/** Load from File / Blob — supports .glb, .gltf, .bj (if actually glTF/GLB). */
export async function loadModelFile(file: File): Promise<LoadedModel> {
  const name = (file.name || '').toLowerCase();
  const buf = await file.arrayBuffer();
  const u8 = new Uint8Array(buf);

  // GLB magic
  if (u8.length >= 4 && u8[0] === 0x67 && u8[1] === 0x6c && u8[2] === 0x54 && u8[3] === 0x46) {
    return parseGlb(buf);
  }
  // ZIP (some .bj / packs)
  if (u8.length >= 2 && u8[0] === 0x50 && u8[1] === 0x4b) {
    throw new Error('ZIP-wrapped models: unzip first, then load the .glb/.gltf inside. (.bj zip not auto-expanded in v1.1)');
  }
  // Try text glTF JSON
  try {
    const text = new TextDecoder().decode(u8);
    if (text.trim().startsWith('{') && text.includes('"asset"')) {
      return parseGltfJson(text);
    }
  } catch { /* fall through */ }

  if (name.endsWith('.bj')) {
    throw new Error(
      '.bj file is not a glTF/GLB binary. Export/convert to .glb (recommended) or .gltf. ' +
      'If your pipeline stores glTF inside .bj, rename to .glb when it starts with magic "glTF".',
    );
  }
  if (name.endsWith('.gltf')) {
    return parseGltfJson(new TextDecoder().decode(u8));
  }
  if (name.endsWith('.glb')) {
    return parseGlb(buf);
  }
  // last resort try GLB parse
  try {
    return parseGlb(buf);
  } catch (e: any) {
    throw new Error(`Unsupported file "${file.name}": ${e.message || e}`);
  }
}

export function getAccessorFloats(json: GltfJson, bin: ArrayBuffer, accessorIndex: number): Float32Array {
  const { data, count, type, componentType } = readAccessor(json, bin, accessorIndex);
  if (componentType === 5126) return data as Float32Array;
  const n = count * NC[type];
  const out = new Float32Array(n);
  const src = data as any;
  for (let i = 0; i < n; i++) out[i] = src[i];
  return out;
}

export function getAccessorIndices(json: GltfJson, bin: ArrayBuffer, accessorIndex: number): Uint32Array {
  const { data, count, componentType } = readAccessor(json, bin, accessorIndex);
  if (componentType === 5125) return data as Uint32Array;
  const out = new Uint32Array(count);
  const src = data as any;
  for (let i = 0; i < count; i++) out[i] = src[i];
  return out;
}
