import React, { useEffect, useRef, useState, type FC } from "react";
import { createAnimationHandlers, load } from "./scripts";
import type { AudioState, AudioVisualizerProps } from "./types";

const AudioVisualizer: FC<AudioVisualizerProps> = ({
  src,
  audioState: audioStateProp,
  onAudioStateChange: onAudioStateChangeProp,
  timeFactor = 1000,
  onTimeChange,
  autoStart = true,
  loop = false,
  volume = 1,
  stagger = 1,
  fftSize = 256,
  playbackRate = 1,
  barWidth = (w, l) => w / l,
  barHeight = h => h * 0.5,
  barColor = (h, l, i) => `hsl(${(360 / l) * i}, ${h}%, 50%)`,
  spaceBetweenBars = 1,
  customDrawFunction = (ctx, { canvasHeight, barWidth, barHeight, x }) => {
    ctx.fillRect(x, canvasHeight - barHeight, barWidth, barHeight);
  },

  onSourceLoaded,
  onSourceEnded,
  onSourcePaused,
  onSourcePlaying,
  ...props
}) => {
  /**
   * Create the audio context and analyser node
   */
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  /**
   * Create an internal state for the audio source,
   * used if the user does not provide their own state
   */
  const [internalState, setInternalState] = useState<AudioState>("unset");

  const audioState = audioStateProp ?? internalState;
  const onAudioStateChange = onAudioStateChangeProp ?? setInternalState;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  /**
   * Create refs for the start and stop animation functions
   * @see createAnimationHandlers in `scripts.ts`
   */
  const startAnimationRef = useRef<(() => void) | null>(null);
  const stopAnimationRef = useRef<(() => void) | null>(null);

  /**
   * This useEffect hook is responsible for creating the animation
   * When any prop that affects the animation is changed, this hook
   * will reset the animation
   */
  useEffect(() => {
    if (!canvasRef.current || !audioContextRef.current || !analyserRef.current)
      return;

    let alreadyRunning = false;

    /**
     * If there was an animation running and the audio is playing
     * we should stop the animation and start it again to make changes
     */
    if (
      startAnimationRef.current &&
      stopAnimationRef.current &&
      audioState === "playing"
    ) {
      stopAnimationRef.current();
      alreadyRunning = true;
    }

    analyserRef.current.fftSize = fftSize;

    const [start, stop] = createAnimationHandlers(
      analyserRef.current,
      canvasRef.current,
      stagger,
      barWidth,
      barHeight,
      barColor,
      spaceBetweenBars,
      customDrawFunction
    );

    /**
     * If the audio is playing, we should start the animation again
     */
    if (alreadyRunning) {
      start();
    }

    startAnimationRef.current = start;
    stopAnimationRef.current = stop;
  }, [analyserRef.current, stagger, fftSize, spaceBetweenBars, playbackRate]);

  /**
   * This useEffect hook is responsible for loading the audio source
   * When the `src` prop is changed, this hook will load the new audio source
   * and starting playing it if `autoStart` is true
   */
  useEffect(() => {
    if (!canvasRef.current || !src) return;

    if (!audioContextRef.current || !analyserRef.current) {
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current = null;

      if (!autoStart) {
        stopAnimationRef.current?.();
      }
    }

    const audio = load(
      src,
      audioContextRef.current,
      analyserRef.current,
      onAudioStateChange,
      () => onSourceLoaded?.(audio),
      () => onAudioStateChange("ended")
    );

    audio.playbackRate = playbackRate;

    audioRef.current = audio;

    if (autoStart) {
      audio.play();
      onAudioStateChange("playing");
    }
  }, [src]);

  /**
   * Make sure the audio is looped when the `loop` prop is changed
   */
  useEffect(() => {
    if (!audioRef.current) return;

    audioRef.current.loop = loop;
  }, [loop]);

  /**
   * Make sure the speed is changed when the `playbackRate` prop is changed
   */
  useEffect(() => {
    if (!audioRef.current) return;

    audioRef.current.playbackRate = playbackRate;
  }, [playbackRate]);

  /**
   * Make sure the volume is changed when the `volume` prop is changed
   */
  useEffect(() => {
    if (!audioRef.current) return;

    audioRef.current.volume = volume;
  }, [volume]);

  /**
   * This useEffect hook is responsible for updating the time elapsed
   * When the audio is playing, we should update the time elapsed every `timeFactor`
   * if the audio is paused or ended, we should stop updating the time elapsed
   */
  useEffect(() => {
    if (!audioRef.current) return;

    let interval: NodeJS.Timeout | null = null;

    switch (audioState) {
      case "playing": {
        interval = setInterval(() => {
          onTimeChange?.(audioRef.current?.currentTime ?? 0);
        }, timeFactor / playbackRate);

        break;
      }

      case "paused":
      case "ended": {
        void (interval && clearInterval(interval));

        break;
      }
    }

    return () => {
      void (interval && clearInterval(interval));
    };
  }, [audioState, timeFactor, playbackRate]);

  /**
   * This useEffect hook is responsible for playing, pausing and ending the audio
   * When the `audioState` prop is changed, this hook will play, pause or end the audio
   */
  useEffect(() => {
    if (!audioRef.current) return;

    switch (audioState) {
      case "playing": {
        audioRef.current.play();

        onSourcePlaying?.(audioRef.current);
        startAnimationRef.current?.();
        break;
      }

      case "paused": {
        audioRef.current.pause();

        onSourcePaused?.(audioRef.current);
        stopAnimationRef.current?.();
        break;
      }

      case "ended": {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;

        onSourceEnded?.(audioRef.current);
        stopAnimationRef.current?.();
        break;
      }
    }
  }, [audioState]);

  return <canvas ref={canvasRef} {...props} />;
};

export * from "./types";
export { AudioVisualizer };
