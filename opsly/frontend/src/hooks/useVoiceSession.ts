import { useRef, useState, useCallback } from 'react';
import { GoogleGenAI, Modality, type Session } from '@google/genai';
import { getVoiceToken, endVoiceSession } from '@/services/api';
import { pcmToBase64, base64ToPcm } from '@/lib/audio-utils';

export type VoiceState =
  | 'IDLE'
  | 'CONNECTING'
  | 'LISTENING'
  | 'USER_SPEAKING'
  | 'AGENT_THINKING'
  | 'AGENT_SPEAKING'
  | 'ERROR';

export interface TranscriptEntry {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  metadata?: {
    photoUrl?: string;
  };
}

interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

export interface UseVoiceSessionOptions {
  onToolCall?: (call: ToolCall) => Promise<unknown>;
  onStateChange?: (state: VoiceState) => void;
}

export function useVoiceSession(options: UseVoiceSessionOptions = {}) {
  const [state, setState] = useState<VoiceState>('IDLE');
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [activeAgent, setActiveAgent] = useState<string>('OpslyRouter');
  const [error, setError] = useState<string | null>(null);

  const sessionRef = useRef<Session | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const captureCtxRef = useRef<AudioContext | null>(null);
  const playbackCtxRef = useRef<AudioContext | null>(null);
  const playbackNodeRef = useRef<AudioWorkletNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const updateState = useCallback((newState: VoiceState) => {
    setState(newState);
    options.onStateChange?.(newState);
  }, [options]);

  const addTranscript = useCallback((role: 'user' | 'assistant', content: string, metadata?: { photoUrl?: string }) => {
    if (!content.trim()) return;
    setTranscript((prev) => {
      const last = prev[prev.length - 1];
      // Append to last bubble if same speaker, otherwise start new bubble (but NOT if metadata is present — photos should be separate)
      if (last && last.role === role && !metadata && !last.metadata) {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...last,
          content: last.content + ' ' + content.trim(),
        };
        return updated;
      }
      return [...prev, { role, content: content.trim(), timestamp: Date.now(), metadata }];
    });
  }, []);

  /** Start a voice session — request token, connect to Gemini Live, start mic */
  const start = useCallback(async () => {
    try {
      updateState('CONNECTING');
      setError(null);
      setTranscript([]);

      // 1. Get ephemeral token from backend
      const tokenData = await getVoiceToken();
      sessionIdRef.current = tokenData.sessionId;

      // 2. Connect to Gemini Live (ephemeral tokens require v1alpha)
      const ai = new GoogleGenAI({
        apiKey: tokenData.ephemeralToken,
        httpOptions: { apiVersion: 'v1alpha' },
      });
      const session = await ai.live.connect({
        model: tokenData.model,
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: tokenData.systemInstruction,
          tools: tokenData.tools as any,
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: tokenData.voiceConfig.voiceName },
            },
          },
          realtimeInputConfig: {
            automaticActivityDetection: {
              disabled: false,
              startOfSpeechSensitivity: 'START_SENSITIVITY_HIGH' as any,
              endOfSpeechSensitivity: 'END_SENSITIVITY_LOW' as any,
              silenceDurationMs: 500,
            },
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            updateState('LISTENING');
          },
          onmessage: (msg: any) => handleMessage(msg),
          onerror: (e: any) => {
            console.error('Gemini Live error:', e);
            setError(e?.message || 'Voice connection error');
            updateState('ERROR');
          },
          onclose: () => {
            if (state !== 'ERROR') updateState('IDLE');
          },
        },
      });

      sessionRef.current = session;

      // 3. Set up audio capture (mic at 16kHz)
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = micStream;

      const captureCtx = new AudioContext({ sampleRate: 16000 });
      await captureCtx.audioWorklet.addModule('/worklets/capture-processor.js');
      const source = captureCtx.createMediaStreamSource(micStream);
      const captureNode = new AudioWorkletNode(captureCtx, 'capture-processor');

      captureNode.port.onmessage = (e) => {
        if (e.data.pcm && sessionRef.current) {
          const base64 = pcmToBase64(e.data.pcm);
          sessionRef.current.sendRealtimeInput({
            audio: { data: base64, mimeType: 'audio/pcm;rate=16000' },
          });
        }
      };

      source.connect(captureNode);
      captureNode.connect(captureCtx.destination); // needed to keep worklet alive
      captureCtxRef.current = captureCtx;

      // 4. Set up audio playback (Gemini output at 24kHz)
      const playbackCtx = new AudioContext({ sampleRate: 24000 });
      await playbackCtx.audioWorklet.addModule('/worklets/playback-processor.js');
      const playbackNode = new AudioWorkletNode(playbackCtx, 'playback-processor');

      playbackNode.port.onmessage = (e) => {
        if (e.data.state === 'ended') {
          updateState('LISTENING');
        }
      };

      playbackNode.connect(playbackCtx.destination);
      playbackCtxRef.current = playbackCtx;
      playbackNodeRef.current = playbackNode;

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to start voice session';
      console.error('Voice start error:', msg);
      setError(msg);
      updateState('ERROR');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Handle incoming Gemini Live messages */
  function handleMessage(msg: any) {
    const sc = msg.serverContent;

    // Interruption — user spoke over the agent
    if (sc?.interrupted) {
      playbackNodeRef.current?.port.postMessage({ clear: true });
      updateState('USER_SPEAKING');
      return;
    }

    // Audio from the model
    if (sc?.modelTurn?.parts) {
      for (const part of sc.modelTurn.parts) {
        if (part.inlineData?.data) {
          updateState('AGENT_SPEAKING');
          const pcm = base64ToPcm(part.inlineData.data);
          playbackNodeRef.current?.port.postMessage({ pcm }, [pcm]);
        }
      }
    }

    // Input transcription (what the user said)
    if (sc?.inputTranscription?.text) {
      addTranscript('user', sc.inputTranscription.text);
      updateState('AGENT_THINKING');
    }

    // Output transcription (what the agent said)
    if (sc?.outputTranscription?.text) {
      addTranscript('assistant', sc.outputTranscription.text);
    }

    // Tool calls from the model
    if (msg.toolCall?.functionCalls) {
      handleToolCalls(msg.toolCall.functionCalls);
    }
  }

  /** Execute tool calls against backend, return results to Gemini */
  async function handleToolCalls(calls: Array<{ id: string; name: string; args: Record<string, unknown> }>) {
    if (!options.onToolCall || !sessionRef.current) return;

    const responses = [];
    for (const call of calls) {
      try {
        const result = await options.onToolCall(call);
        responses.push({ id: call.id, name: call.name, response: result as Record<string, unknown> });
      } catch (err) {
        responses.push({
          id: call.id,
          name: call.name,
          response: { error: err instanceof Error ? err.message : 'Tool call failed' },
        });
      }
    }

    sessionRef.current.sendToolResponse({ functionResponses: responses });
  }

  /** Stop the voice session — tear down audio, close connection, save transcript */
  const stop = useCallback(async () => {
    // Stop mic stream
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    // Close audio contexts
    await captureCtxRef.current?.close().catch(() => {});
    await playbackCtxRef.current?.close().catch(() => {});
    captureCtxRef.current = null;
    playbackCtxRef.current = null;
    playbackNodeRef.current = null;

    // Close Gemini session
    sessionRef.current?.close();
    sessionRef.current = null;

    // Save transcript to backend
    if (sessionIdRef.current && transcript.length > 0) {
      await endVoiceSession(
        sessionIdRef.current,
        transcript.map((t) => ({ role: t.role, content: t.content })),
      ).catch(() => {});
    }

    sessionIdRef.current = null;
    updateState('IDLE');
  }, [transcript, updateState]);

  return {
    state,
    transcript,
    activeAgent,
    error,
    start,
    stop,
    setActiveAgent,
    addTranscript,
  };
}
