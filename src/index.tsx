import React, { useEffect, useRef, useState } from "react";

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

  /**
   * A state variable that indicatedsif the source is playing. This is used to control
   * the pausing / resuming of the source.
   * It should be paired with the `onPlayingChange` prop.
   *
   * @example
   * const [playing, setPlaying] = useState(false);
   *
   * return <AudioVisualizer src={...} playing={playing} onPlayingChange={setPlaying} />
   */
  playing?: boolean;

  /**
   * Function used to toggle the playing state internally. It should be paired with the `playing` prop.
   *
   * @example
   * const [playing, setPlaying] = useState(false);
   *
   * return <AudioVisualizer src={...} playing={playing} onPlayingChange={setPlaying} />
   */
  onPlayingChange?: (playing: boolean) => void;

  /**
   * A state variable that indicates if the source has ended. This is used to control
   * the ending / restarting of the source.
   * It should be paired with the `onEndedChange` prop.
   */
  ended?: boolean;

  /**
   * Function used to toggle the ended state internally. It should be paired with the `ended` prop.
   */
  onEndedChange?: (ended: boolean) => void;

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
  barHeight?: (
    defaultHeight: number,
    index: number,
    freqLength: number
  ) => number;

  /**
   * The color of each bar. This is a function that must return a CSS color.
   * Note: this function gets called for each bar in the visualizer.
   * @param defaultHeight The default height of the bar
   * @param index The index of the currently drawn bar.
   * @param freqLength The length of the audio buffer
   * @returns The new bar color
   */
  barColor?: (
    defaultHeight: number,
    index: number,
    freqLength: number
  ) => string;

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
  playing: playingProp,
  onPlayingChange: onPlayingChangeProp,
  ended: endedProp,
  onEndedChange: onEndedChangeProp,
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
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [loaded, setLoaded] = useState<boolean>(false);

  /**
   * Since playing, setPlaying and ended, setEnded are requried to be controlled, we need to manage them internally
   * if the user does not provide them, because while they are needed to work, they are not needed for the user to control
   */
  const [internalPlaying, setInternalPlaying] = useState<boolean>(false);
  const [internalEnded, setInternalEnded] = useState<boolean>(false);

  /**
   * Check if the user provided the playing and ended props, if not, use the internal ones
   */
  const playing = playingProp ?? internalPlaying;
  const onPlayingChange = onPlayingChangeProp ?? setInternalPlaying;
  const ended = endedProp ?? internalEnded;
  const onEndedChange = onEndedChangeProp ?? setInternalEnded;

  const [started, setStarted] = useState<boolean>(false);

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
      /**
       * If the audio buffer is present, means the audio file is already loaded, use that isntead
       * (e.g the user wants to play the same audio file again)
       */
      if (audioBuffer) {
        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;

        source.connect(analyser);
        analyser.connect(audioCtx.destination);

        setLoaded(true);

        sourceRef.current = source;

        res(source);
      } else {
        /**
         * Else, fetch the audio file and decode it
         */
        fetch(src)
          .then(res => res.arrayBuffer())
          .then(arrayBuffer => audioCtx.decodeAudioData(arrayBuffer))
          .then(audioBuffer => {
            const source = audioCtx.createBufferSource();
            source.buffer = audioBuffer;

            source.connect(analyser);
            analyser.connect(audioCtx.destination);

            setLoaded(true);

            sourceRef.current = source;

            setAudioBuffer(audioBuffer);

            res(source);
          })
          .catch(rej);
      }
    });
  };

  /**
   * Function to start the source node and draw the visualizer
   * Sets all the necessary flags and event listeners
   */
  const start = () => {
    if (!sourceRef.current || !analyserRef.current || !canvasRef.current)
      return;

    sourceRef.current.start();

    drawBars(analyserRef.current, canvasRef.current.getContext("2d")!);
    setStarted(true);
    onEndedChange?.(false);
    onPlayingChange?.(true);

    sourceRef.current.onended = () => {
      onSourceEnded?.();
      setStarted(false);
      onEndedChange?.(true);
      onPlayingChange?.(false);
      cancelAnimationFrame(frameID);
    };
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

  /**
   * When the source changes, load the new audio file
   */
  useEffect(() => {
    if (!audioCtx) return;

    load();
  }, [src, audioCtx]);

  /**
   * When the source is loaded, call the onSourceLoaded callback
   * If autoStart is true, start the audio
   */
  useEffect(() => {
    if (!sourceRef.current) return;

    if (loaded) {
      onSourceLoaded?.(sourceRef.current);

      if (autoStart) {
        start();
      }
    }
  }, [loaded]);

  /**
   * When the started flag is set to true, call the onSourceStarted callback
   */
  useEffect(() => {
    if (started) {
      onSourceStarted?.();
    }
  }, [started]);

  /**
   * When the playing flag changes, start / resume or pause the audio
   *
   * If the audio is playing, check if it is started.
   * If it is started, resume, else start.
   *
   * If the audio is not playing, check if it is started.
   * If it is started, suspend.
   */
  useEffect(() => {
    if (!audioCtx || !loaded) return;

    if (playing) {
      if (started) {
        audioCtx.resume();
      } else if (ended) {
        load().then(start).catch(console.error);
      } else {
        start();
      }
    } else {
      if (started) {
        audioCtx.suspend();
      }
    }
  }, [playing, audioCtx, started, loaded]);

  return <canvas {...props} ref={canvasRef} />;
};

export { AudioVisualizer };
