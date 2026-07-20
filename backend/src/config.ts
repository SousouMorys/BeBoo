const imageQualities = ['low', 'medium', 'high'] as const;
const narrationVoices = ['marin', 'cedar'] as const;

export type ImageQuality = (typeof imageQualities)[number];
export type NarrationVoice = (typeof narrationVoices)[number];

function envValue(name: string, fallback: string): string {
  const value = process.env[name]?.trim();
  return value || fallback;
}

function imageQuality(): ImageQuality {
  const value = envValue('IMAGE_QUALITY', 'low');
  if ((imageQualities as readonly string[]).includes(value)) {
    return value as ImageQuality;
  }

  throw new Error(`IMAGE_QUALITY must be one of: ${imageQualities.join(', ')}.`);
}

function narrationVoice(): NarrationVoice {
  const value = envValue('TTS_VOICE', 'marin');
  return (narrationVoices as readonly string[]).includes(value) ? (value as NarrationVoice) : 'marin';
}

/** The only source of model and narration defaults for the generation pipeline. */
export const generationConfig = Object.freeze({
  textModel: envValue('TEXT_MODEL', 'gpt-5.6'),
  imageModel: envValue('IMAGE_MODEL', 'gpt-image-1-mini'),
  imageQuality: imageQuality(),
  ttsModel: envValue('TTS_MODEL', 'gpt-4o-mini-tts'),
  ttsVoice: narrationVoice(),
  transcriptionModel: 'whisper-1' as const,
});
