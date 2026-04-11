// ElevenLabs TTS — CardioDil AI
// Converts Dil's text responses to spoken audio
// Uses expo-av for playback on iOS
// Voice settings tuned for Dil's clinical-warm tone profile

import { Audio } from 'expo-av';

const ELEVENLABS_API_KEY = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY!;
const VOICE_ID = process.env.EXPO_PUBLIC_ELEVENLABS_VOICE_ID!;
const BASE_URL = 'https://api.elevenlabs.io/v1';

// Voice settings for Dil
// Stability 0.68 — slight natural variation, not robotic
// Similarity Boost 0.82 — stays consistent to Dil's voice identity
// Style 0.15 — subtle expression, not dramatic
// Speaker Boost — keeps Dil clear in any environment
const DIL_VOICE_SETTINGS = {
  stability: 0.68,
  similarity_boost: 0.82,
  style: 0.15,
  use_speaker_boost: true,
};

let currentSound: Audio.Sound | null = null;

// Stop any currently playing Dil audio
export async function stopDil(): Promise<void> {
  if (currentSound) {
    try {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
    } catch {
      // Already stopped
    } finally {
      currentSound = null;
    }
  }
}

// Speak a Dil response aloud
// Stops any current playback before starting new audio
export async function speak(text: string): Promise<void> {
  if (!ELEVENLABS_API_KEY || !VOICE_ID) {
    console.warn('[Dil TTS] Missing API key or Voice ID — check .env.local');
    return;
  }

  // Stop any existing playback
  await stopDil();

  try {
    // Request audio from ElevenLabs
    const response = await fetch(
      `${BASE_URL}/text-to-speech/${VOICE_ID}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: DIL_VOICE_SETTINGS,
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error('[Dil TTS] ElevenLabs error:', response.status, err);
      return;
    }

    // Convert response to base64 for expo-av
    const arrayBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    bytes.forEach((b) => { binary += String.fromCharCode(b); });
    const base64 = btoa(binary);
    const uri = `data:audio/mpeg;base64,${base64}`;

    // Configure audio session for iOS playback
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });

    // Load and play
    const { sound } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: true, volume: 1.0 }
    );

    currentSound = sound;

    // Clean up after playback completes
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync().catch(() => {});
        currentSound = null;
      }
    });

  } catch (error) {
    console.error('[Dil TTS] Playback failed:', error);
  }
}

// Speak with a delay — useful for letting UI render first
export async function speakAfterDelay(
  text: string,
  delayMs: number = 600
): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(async () => {
      await speak(text);
      resolve();
    }, delayMs);
  });
}

// Check if Dil is currently speaking
export function isSpeaking(): boolean {
  return currentSound !== null;
}
