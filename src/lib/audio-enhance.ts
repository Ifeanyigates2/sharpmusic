export type MixPresetId =
  | "balanced"
  | "louder"
  | "bright"
  | "warm"
  | "bass";

export type MixPreset = {
  id: MixPresetId;
  label: string;
  description: string;
  lowGain: number;
  midGain: number;
  highGain: number;
  threshold: number;
  ratio: number;
  makeup: number;
  targetPeak: number;
};

export const MIX_PRESETS: MixPreset[] = [
  {
    id: "balanced",
    label: "Balanced",
    description: "Gentle polish — light EQ and compression",
    lowGain: 1.5,
    midGain: 0.5,
    highGain: 1.5,
    threshold: -18,
    ratio: 2.5,
    makeup: 2,
    targetPeak: 0.89,
  },
  {
    id: "louder",
    label: "Louder",
    description: "More presence and punch for streaming",
    lowGain: 2,
    midGain: 1,
    highGain: 2.5,
    threshold: -22,
    ratio: 4,
    makeup: 4,
    targetPeak: 0.95,
  },
  {
    id: "bright",
    label: "Bright",
    description: "Clearer highs and air",
    lowGain: -0.5,
    midGain: 1,
    highGain: 4,
    threshold: -16,
    ratio: 2.2,
    makeup: 2,
    targetPeak: 0.9,
  },
  {
    id: "warm",
    label: "Warm",
    description: "Softer top end, richer body",
    lowGain: 3,
    midGain: 1.5,
    highGain: -1,
    threshold: -18,
    ratio: 2.8,
    makeup: 2.5,
    targetPeak: 0.9,
  },
  {
    id: "bass",
    label: "Bass boost",
    description: "Deeper low end for club/car systems",
    lowGain: 5,
    midGain: 0,
    highGain: 1,
    threshold: -20,
    ratio: 3,
    makeup: 2,
    targetPeak: 0.9,
  },
];

export function getMixPreset(id: MixPresetId): MixPreset {
  return MIX_PRESETS.find((p) => p.id === id) || MIX_PRESETS[0];
}

export async function decodeAudioUrl(url: string): Promise<AudioBuffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Could not load track audio");
  const data = await res.arrayBuffer();
  const ctx = new AudioContext();
  try {
    return await ctx.decodeAudioData(data.slice(0));
  } finally {
    await ctx.close();
  }
}

export async function enhanceAudioBuffer(
  buffer: AudioBuffer,
  preset: MixPreset,
): Promise<AudioBuffer> {
  const offline = new OfflineAudioContext(
    buffer.numberOfChannels,
    buffer.length,
    buffer.sampleRate,
  );

  const source = offline.createBufferSource();
  source.buffer = buffer;

  const low = offline.createBiquadFilter();
  low.type = "lowshelf";
  low.frequency.value = 120;
  low.gain.value = preset.lowGain;

  const mid = offline.createBiquadFilter();
  mid.type = "peaking";
  mid.frequency.value = 1000;
  mid.Q.value = 0.9;
  mid.gain.value = preset.midGain;

  const high = offline.createBiquadFilter();
  high.type = "highshelf";
  high.frequency.value = 6500;
  high.gain.value = preset.highGain;

  const compressor = offline.createDynamicsCompressor();
  compressor.threshold.value = preset.threshold;
  compressor.knee.value = 12;
  compressor.ratio.value = preset.ratio;
  compressor.attack.value = 0.01;
  compressor.release.value = 0.22;

  const makeup = offline.createGain();
  makeup.gain.value = Math.pow(10, preset.makeup / 20);

  source.connect(low);
  low.connect(mid);
  mid.connect(high);
  high.connect(compressor);
  compressor.connect(makeup);
  makeup.connect(offline.destination);

  source.start(0);
  const rendered = await offline.startRendering();
  return normalizeBuffer(rendered, preset.targetPeak);
}

function normalizeBuffer(buffer: AudioBuffer, targetPeak: number): AudioBuffer {
  let peak = 0;
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const data = buffer.getChannelData(c);
    for (let i = 0; i < data.length; i++) {
      const v = Math.abs(data[i]);
      if (v > peak) peak = v;
    }
  }

  if (peak < 0.00001) return buffer;

  const scale = targetPeak / peak;
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const data = buffer.getChannelData(c);
    for (let i = 0; i < data.length; i++) {
      data[i] *= scale;
    }
  }
  return buffer;
}

export function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1;
  const bitDepth = 16;

  const samples = buffer.length;
  const blockAlign = (numChannels * bitDepth) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples * blockAlign;
  const bufferSize = 44 + dataSize;
  const arrayBuffer = new ArrayBuffer(bufferSize);
  const view = new DataView(arrayBuffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  const channels: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) {
    channels.push(buffer.getChannelData(c));
  }

  let offset = 44;
  for (let i = 0; i < samples; i++) {
    for (let c = 0; c < numChannels; c++) {
      const sample = Math.max(-1, Math.min(1, channels[c][i]));
      view.setInt16(
        offset,
        sample < 0 ? sample * 0x8000 : sample * 0x7fff,
        true,
      );
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}

function writeString(view: DataView, offset: number, text: string) {
  for (let i = 0; i < text.length; i++) {
    view.setUint8(offset + i, text.charCodeAt(i));
  }
}
