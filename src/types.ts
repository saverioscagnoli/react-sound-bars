/**
 * The possible states of the audio source
 *
 * unset: The audio src is not set
 * loading: The audio src is being loaded
 * pending: The audio src is loaded and ready to play
 * paused: The audio src is paused
 * playing: The audio src is playing
 * ended: The audio src has ended
 */
type AudioState = "unset" | "loading" | "pending" | "paused" | "playing" | "ended";

type CustomBarWidthArg =
  | ((canvasWidth: number, bufferLength: number) => number)
  | number;

type CustomBarHeightArg = (
  defaultHeight: number,
  bufferLength: number,
  index: number
) => number;

type CustomBarColorArg =
  | ((
      barHeight: number,
      bufferLength: number,
      index: number
    ) => string | CanvasGradient | CanvasPattern)
  | (string | CanvasGradient | CanvasPattern);

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
   * The default x of the canvas
   */
  x: number;

  /**
   * The index of the currently drawn bar
   */
  index: number;
};

export type {
  AudioState,
  CustomBarColorArg,
  CustomBarHeightArg,
  CustomBarWidthArg,
  CustomDrawFunctionArgs
};

type AudioVisualizerProps = React.ComponentPropsWithoutRef<"canvas"> & {
  /**
   * The source of the audio file as a string.
   * It could be either a path to a local file, or a base64 string.
   */
  src: string;

  /**
   * The state of the audio source.
   *
   * @example
   * const [audioState, setAudioState] = useState<AudioState>("unset");
   *
   * <AudioVisualizer src="path/to/audio.mp3" audioState={audioState} onAudioStateChange={setAudioState} />
   */
  audioState?: AudioState;

  /**
   * Callback function fired when the audio state changes.
   *
   * @example
   * const [audioState, setAudioState] = useState<AudioState>("unset");
   *
   * <AudioVisualizer src="path/to/audio.mp3" audioState={audioState} onAudioStateChange={setAudioState} />
   */
  onAudioStateChange?: (state: AudioState) => void;

  /**
   * Function that gets called when the time of the source changes
   * (e.g when the source is playing, used to update the time of the audio player)
   */
  onTimeChange?: (time: number) => void;

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
  barWidth?: CustomBarWidthArg;

  /**
   * The height of each bar. This is a function that must return the actual number.
   * Note: this function gets called for each bar in the visualizer.
   *
   * @param defaultHeight The default height of the bar.
   * @param bufferLength The length of the audio buffer
   * @param index The index of the currently drawn bar
   * @returns The new bar height
   */
  barHeight?: CustomBarHeightArg;

  /**
   * The color of each bar.
   * This could be a CanvasGradient, CanvasPattern or a string.
   * Or it could be function that must return a CanvasGradient, CanvasPattern or a string.
   * Note: this function gets called for each bar in the visualizer.
   * @param barHeight The height of the bar.
   * @param bufferLength The length of the audio buffer
   * @param index The index of the currently drawn bar.
   * @returns The new bar color
   */
  barColor?: CustomBarColorArg;

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

export type { AudioVisualizerProps };
