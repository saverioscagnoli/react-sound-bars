import React, { useEffect, useRef, useState } from "react";

type AudioState = "unset" | "loading" | "pending" | "paused" | "playing" | "ended";

type CustomDrawFunctionArgs = {
  /**
   * The width of the canvas where the visualizer is drawn
   */
  canvasWidth: number;

  /**
   * The height of the canvas where the visualizer is drawn
   */
  canvasHeight: number;

  /**
   * The width of each bar of the visualizer
   */
  barWidth: number;

  /**
   * The height of each bar of the visualizer
   */
  barHeight: number;

  /**
   * The index of the currently drawn bar
   */
  index: number;

  /**
   * The default x of the canvas
   */
  x: number;
};

type AudioVisualizerProps = React.ComponentPropsWithoutRef<"canvas"> & {
  /**
   * The source of the audio file as a string.
   * It could be either a path to a local file, or a base64 string.
   */
  src: string;

  audioState?: AudioState;

  onAudioStateChange: (state: AudioState) => void;

  /**
   * Wheter the source should start automatically after loading
   * @default true
   */
  autoStart?: boolean;

  /**
   * The rate at which the rendering function should be throttled, saving performance.
   * @default 1
   */
  stagger?: number;

  /**
   * The width of the bars. This could be a fixed number, or a function can be passed with the canvasWidth and
   * the buffer length, so it can be setted programmatically.
   *
   * @default (canvasWidth, freqLength) => canvasWidth / freqLength
   */
  barWidth?: number | ((canvasWidth: number, freqLength: number) => number);

  /**
   * The height of each bar. This is a function that must return the actual number.
   * Note: this function gets called for each bar in the visualizer.
   *
   * @param defaultHeight The default height of the bar.
   * @param index The index of the currently drawn bar
   * @param freqLength The length of the audio buffer
   * @returns The new bar height
   */
  barHeight?: (defaultHeight: number, index: number, freqLength: number) => number;

  /**
   * The color of each bar. This is a function that must return a CSS color.
   * Note: this function gets called for each bar in the visualizer.
   * @param defaultHeight The default height of the bar
   * @param index The index of the currently drawn bar.
   * @param freqLength The length of the audio buffer
   * @returns The new bar color
   */
  barColor?: (defaultHeight: number, index: number, freqLength: number) => string;

  /**
   * The padding between each bar
   */
  spaceBetweenBars?: number;

  /**
   * fftSize
   * @default 2048
   * @see https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/fftSize
   */
  fftSize?: number;

  /**
   * This is a custom function that defines how each bar is drawn.
   * Note: this function gets called for each bar in the visualizer.
   *
   *
   * @param ctx The canvas context
   * @param args The necessary args to customize the drawing process
   * @see CustomDrawFunctionArgs
   *
   * @default (ctx, { x, canvasHeight, barWidth, barHeight }) => ctx.fillRect(x, canvasHeight - barHeight, barWidth, barHeight);
   */
  customDrawFunction?: (
    ctx: CanvasRenderingContext2D,
    args: CustomDrawFunctionArgs
  ) => void;

  /**
   * Callback function fired when the source is loaded
   * @param source the source buffer
   */
  onSourceLoaded?: (source: AudioBufferSourceNode) => void;

  /**
   * Callback function fired when the source starts.
   */
  onSourceStarted?: () => void;

  /**
   * Callback function fired when the source ends.
   */
  onSourceEnded?: () => void;
};

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  src,
  autoStart = true,
  audioState: audioStateProp,
  onAudioStateChange: onAudioStateChangeProp,
  stagger = 1,
  barWidth,
  barHeight,
  barColor,
  spaceBetweenBars = 1,
  fftSize = 2048,
  customDrawFunction,
  onSourceLoaded,
  onSourceStarted,
  onSourceEnded,
  ...props
}) => {
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);

  /**
   * Since playing, setPlaying and ended, setEnded are requried to be controlled, we need to manage them internally
   * if the user does not provide them, because while they are needed to work, they are not needed for the user to control
   */
  const [internalState, setInternalState] = useState<AudioState>("unset");

  /**
   * Check if the user provided the playing and ended props, if not, use the internal ones
   */
  const audioState = audioStateProp ?? internalState;
  const onAudioStateChange = onAudioStateChangeProp ?? setInternalState;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  let [frame, frameID] = [0, 0];

  /**
   * The drawing logic of the visualizer. The user can provide all the necessary customizations
   * If not, use the default ones.
   *
   * @param analyser The analyser node
   * @param ctx The context of the canvas
   */
  const drawBars = (analyser: AnalyserNode, ctx: CanvasRenderingContext2D) => {
    frame++;

    if (frame % stagger !== 0) {
      frameID = requestAnimationFrame(() => drawBars(analyser, ctx));
      return;
    }

    const freq = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(freq);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    /**
     * Check for user customization and set bar width accordingly
     */
    let bw: number;

    if (barWidth) {
      bw =
        typeof barWidth === "function"
          ? barWidth(ctx.canvas.width, freq.length)
          : barWidth;
    } else {
      bw = ctx.canvas.width / freq.length;
    }

    let x = 0;

    for (let i = 0; i < freq.length; i++) {
      const defaultHeight = freq[i];

      /**
       * Check for user customization and set bar height and color accordingly
       */
      let bh: number;

      if (barHeight) {
        bh = barHeight(defaultHeight, i, freq.length);
      } else {
        bh = defaultHeight;
      }

      /**
       * Check for user customization and set bar color accordingly
       */
      let bc: string;

      if (barColor) {
        bc = barColor(i, defaultHeight, freq.length);
      } else {
        bc = "green";
      }

      ctx.fillStyle = bc;

      /**
       * If the user provided a custom draw function, use it, otherwise use the default one
       */
      if (customDrawFunction) {
        customDrawFunction(ctx, {
          canvasWidth: ctx.canvas.width,
          canvasHeight: ctx.canvas.height,
          barWidth: bw,
          barHeight: bh,
          index: i,
          x
        });
      } else {
        ctx.fillRect(x, ctx.canvas.height - bh, bw, bh);
      }

      x += bw + spaceBetweenBars;
    }

    frameID = requestAnimationFrame(() => drawBars(analyser, ctx));
  };

  /**
   * Function to load the audio file and create the audio buffer source node
   */
  const load = async () => {
    if (!canvasRef.current || !audioCtx) return;

    const analyser = audioCtx.createAnalyser();
    analyserRef.current = analyser;
    analyser.fftSize = fftSize;

    return new Promise<AudioBufferSourceNode>((res, rej) => {
      fetch(src)
        .then(res => res.arrayBuffer())
        .then(arrayBuffer => audioCtx.decodeAudioData(arrayBuffer))
        .then(audioBuffer => {
          const source = audioCtx.createBufferSource();
          source.buffer = audioBuffer;

          source.connect(analyser);
          analyser.connect(audioCtx.destination);

          source.addEventListener("ended", () => {
            onAudioStateChange("ended");
          });

          sourceRef.current = source;

          onAudioStateChange("pending");
          res(source);
        })
        .catch(rej);
    });
  };

  const start = () => {
    if (
      !sourceRef.current ||
      !canvasRef.current ||
      !analyserRef.current ||
      ["playing", "paused"].includes(audioState)
    )
      return;

    sourceRef.current.start();

    onAudioStateChange("playing");

    const ctx = canvasRef.current.getContext("2d")!;

    drawBars(analyserRef.current, ctx);
  };

  const stop = () => {
    if (sourceRef.current && ["playing", "paused"].includes(audioState)) {
      /**
       * Use disconnect and not end, to not trigger the ended event on the source.
       */
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
  };

  /**
   * When the component mounts, create the audio context
   * When the component unmounts, close the audio context
   */
  useEffect(() => {
    setAudioCtx(new AudioContext());

    return () => {
      audioCtx?.close();
    };
  }, []);

  useEffect(() => {
    if (!audioCtx) return;

    if (sourceRef.current) {
      stop();
    }

    onAudioStateChange("loading");
    load();
  }, [audioCtx, src]);

  useEffect(() => {
    if (!audioCtx) return;

    switch (audioState) {
      case "pending": {
        if (autoStart) {
          start();
        }

        break;
      }

      case "playing": {
        audioCtx.resume();

        break;
      }

      case "paused": {
        audioCtx.suspend();

        break;
      }

      default: {
        break;
      }
    }
  }, [audioCtx, audioState]);

  return <canvas {...props} ref={canvasRef} />;
};

export { AudioVisualizer };
export type { AudioState };
