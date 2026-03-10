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
  | 'RECONNECTING'
  | 'ERROR';

export interface TranscriptEntry {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  metadata?: {
    photoUrl?: string;
    aiTip?: boolean;
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

const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_DELAY_MS = 1500;

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
  // Pause audio streaming during tool calls (prevents error 1008)
  const toolCallActiveRef = useRef<boolean>(false);
  // Track reconnection attempts
  const reconnectCountRef = useRef<number>(0);
  // Flag to distinguish intentional stop from unexpected close
  const intentionalCloseRef = useRef<boolean>(false);
  // Store token data for reconnection
  const tokenDataRef = useRef<any>(null);

  const updateState = useCallback((newState: VoiceState) => {
    setState(newState);
    options.onStateChange?.(newState);
  }, [options]);

  const addTranscript = useCallback((role: 'user' | 'assistant', content: string, metadata?: TranscriptEntry['metadata']) => {
    if (!content.trim()) return;
    setTranscript((prev) => {
      const last = prev[prev.length - 1];
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

  /** Tear down audio resources without ending the backend session */
  function teardownAudio() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    captureCtxRef.current?.close().catch(() => {});
    playbackCtxRef.current?.close().catch(() => {});
    captureCtxRef.current = null;
    playbackCtxRef.current = null;
    playbackNodeRef.current = null;
  }

  /** Core connection logic — used by both start() and reconnect() */
  async function connectToGemini(tokenData: any): Promise<void> {
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
          reconnectCountRef.current = 0; // Reset on successful connection
          updateState('LISTENING');
        },
        onmessage: (msg: any) => handleMessage(msg),
        onerror: (e: any) => {
          console.error('Gemini Live error:', e?.code, e?.reason, e?.message);
          setError(e?.message || 'Voice connection error');
          updateState('ERROR');
        },
        onclose: (e: any) => {
          const code = e?.code;
          const reason = e?.reason || 'no reason';
          console.warn('Gemini Live closed:', code, reason);
          sessionRef.current = null;
          toolCallActiveRef.current = false;

          // Auto-reconnect on 1008 ONLY if we had a working session (not initial failure)
          const hadActiveSession = reconnectCountRef.current === 0 && state !== 'CONNECTING';
          if (!intentionalCloseRef.current && code === 1008 && hadActiveSession && reconnectCountRef.current < MAX_RECONNECT_ATTEMPTS) {
            reconnectCountRef.current++;
            console.log(`Auto-reconnecting (attempt ${reconnectCountRef.current}/${MAX_RECONNECT_ATTEMPTS})...`);
            updateState('RECONNECTING');
            handleReconnect();
            return;
          }

          if (state !== 'ERROR') updateState('IDLE');
        },
      },
    });

    sessionRef.current = session;
  }

  /** Set up mic capture and audio playback */
  async function setupAudio(): Promise<void> {
    // Mic capture at 16kHz
    const micStream = await navigator.mediaDevices.getUserMedia({
      audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true },
    });
    streamRef.current = micStream;

    const captureCtx = new AudioContext({ sampleRate: 16000 });
    await captureCtx.audioWorklet.addModule('/worklets/capture-processor.js');
    const source = captureCtx.createMediaStreamSource(micStream);
    const captureNode = new AudioWorkletNode(captureCtx, 'capture-processor');

    captureNode.port.onmessage = (e) => {
      if (e.data.pcm && sessionRef.current && !toolCallActiveRef.current) {
        try {
          const base64 = pcmToBase64(e.data.pcm);
          sessionRef.current.sendRealtimeInput({
            audio: { data: base64, mimeType: 'audio/pcm;rate=16000' },
          });
        } catch {
          // Session closed mid-send — onclose handler will clean up
        }
      }
    };

    source.connect(captureNode);
    captureNode.connect(captureCtx.destination);
    captureCtxRef.current = captureCtx;

    // Playback at 24kHz (Gemini output sample rate)
    const playbackCtx = new AudioContext({ sampleRate: 24000 });
    await playbackCtx.audioWorklet.addModule('/worklets/playback-processor.js');
    const playbackNode = new AudioWorkletNode(playbackCtx, 'playback-processor');

    playbackNode.port.onmessage = (e) => {
      if (e.data.state === 'ended') updateState('LISTENING');
    };

    playbackNode.connect(playbackCtx.destination);
    playbackCtxRef.current = playbackCtx;
    playbackNodeRef.current = playbackNode;
  }

  /** Auto-reconnect after 1008 — get fresh token and reconnect */
  async function handleReconnect(): Promise<void> {
    teardownAudio();
    try {
      // Get a fresh ephemeral token
      const tokenData = await getVoiceToken();
      tokenDataRef.current = tokenData;
      // Keep the same backend session ID — don't create a new one
      await connectToGemini(tokenData);
      await setupAudio();
      console.log('Voice session reconnected successfully');
    } catch (err) {
      console.error('Reconnect failed:', err);
      setError('Voice connection lost. Please try again.');
      updateState('ERROR');
    }
  }

  /** Start a voice session — request token, connect to Gemini Live, start mic */
  const start = useCallback(async () => {
    try {
      intentionalCloseRef.current = false;
      reconnectCountRef.current = 0;
      updateState('CONNECTING');
      setError(null);
      setTranscript([]);

      // 1. Get ephemeral token from backend
      const tokenData = await getVoiceToken();
      sessionIdRef.current = tokenData.sessionId;
      tokenDataRef.current = tokenData;

      // 2. Connect to Gemini Live
      await connectToGemini(tokenData);

      // 3. Set up audio I/O
      await setupAudio();
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

    // Audio from the model (ignore part.text — those are thinking/reasoning tokens)
    if (sc?.modelTurn?.parts) {
      for (const part of sc.modelTurn.parts) {
        if (part.inlineData?.data) {
          updateState('AGENT_SPEAKING');
          const pcm = base64ToPcm(part.inlineData.data);
          playbackNodeRef.current?.port.postMessage({ pcm }, [pcm]);
        }
      }
    }

    // Input transcription (if server sends it despite config omission)
    if (sc?.inputTranscription?.text) {
      addTranscript('user', sc.inputTranscription.text);
      updateState('AGENT_THINKING');
    }

    // Output transcription (if server sends it despite config omission)
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

    // Pause audio streaming — Gemini rejects sendRealtimeInput during tool calls
    toolCallActiveRef.current = true;

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

    try {
      sessionRef.current.sendToolResponse({ functionResponses: responses });
    } catch {
      // Session may have closed during tool execution
    }

    // Resume audio streaming after tool response sent
    toolCallActiveRef.current = false;
  }

  /** Stop the voice session — tear down audio, close connection, save transcript */
  const stop = useCallback(async () => {
    intentionalCloseRef.current = true; // Prevent auto-reconnect
    teardownAudio();

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

  /** Send text into the live Gemini session using proper clientContent API */
  const sendText = useCallback((text: string, opts?: { silent?: boolean }): boolean => {
    if (!sessionRef.current) return false;
    try {
      // Pause audio so Gemini processes the text as the active turn
      toolCallActiveRef.current = true;
      playbackNodeRef.current?.port.postMessage({ clear: true });

      // Use sendClientContent with turnComplete — the proper Live API method
      sessionRef.current.sendClientContent({
        turns: [{ role: 'user', parts: [{ text }] }],
        turnComplete: true,
      });

      if (!opts?.silent) {
        addTranscript('user', text);
      }
      updateState('AGENT_THINKING');
      // Resume audio after server has time to process the text turn
      setTimeout(() => { toolCallActiveRef.current = false; }, 2000);
      return true;
    } catch {
      toolCallActiveRef.current = false;
      return false;
    }
  }, [addTranscript, updateState]);

  return {
    state,
    transcript,
    activeAgent,
    error,
    start,
    stop,
    sendText,
    setActiveAgent,
    addTranscript,
  };
}
