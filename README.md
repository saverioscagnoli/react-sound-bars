<div align="center">
<img src="./docs/logo.gif">
</div>

<div align="center">
<img alt="GitHub Actions Workflow Status" src="https://img.shields.io/github/actions/workflow/status/saverioscagnoli/react-visual-audio/main.yml">
&nbsp;
<img alt="NPM License" src="https://img.shields.io/npm/l/react-visual-audio">
&nbsp;
<img src="https://img.shields.io/badge/Dependencies-0-2ea44f" alt="Dependencies - 0">
&nbsp;
<a href="https://www.npmjs.com/package/react-visual-audio"><img alt="NPM Version" src="https://img.shields.io/npm/v/react-visual-audio"></a>
&nbsp;
<img alt="GitHub last commit" src="https://img.shields.io/github/last-commit/saverioscagnoli/react-visual-audio">
</div>

<div align="center">
<a href="#introduction">Introduction</a> &nbsp;
<a href="#installation">Installation</a> &nbsp;
<a href="#usage">Usage</a> &nbsp;
<a href="#documentation">Documentation</a> &nbsp;
<a href="#license">License</a>
</div>

# Introduction

Audio Visualizers are graphics representation of audio frequency data, creating beautiful and whimsical variations 🧙‍♂️

This library provides a beautiful, lightweight and extremely customizable `AudioVisualizer` component, used to represent any html audio source you wish.

# Installation

If you just want to edit the code and / or play around with storybook:

```
git clone https://github.com/saverioscagnoli/react-visual-audio

cd react-visual-audio
```

This package uses the `yarn` package manager:

```
yarn install
```

To start storybook:

```
yarn storybook
```

Installation using popular package managers:

```
npm i react-visual-audio

yarn add react-visual-audio

pnpm add react-visual-audio

bun install react-visual audio
```

# Usage

```tsx
import { useState, useMemo } from "react";
import { AudioVisualizer, AudioState } from "react-visual-audio";

const AudioPreview = () => {
  const [src, setSrc] = useState<string | null>(null);
  const [audioState, setAudioState] = useState<AudioState>("unset");

  const playOrResume = () => {
    setAudioState("playing");
  };

  const pause = () => {
    setAudioState("pause");
  };

  const disabled = useMemo(
    () => ["unset", "loading"].includes(audioState),
    [audioState]
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5" }}>
        <button disabled={disabled} onClick={playOrResume}>
          play
        </button>
        <button disabled={disabled} onClick={pause}>
          pause
        </button>
      </div>

      <AudioVisualizer
        src={src}
        audioState={audioState}
        onAudioStateChange={setAudioState}
        barHeight={defaultHeight => defaultHeight / 2}
        barWidth={(canvasWidth, bufferLength) => canvasWidth / bufferLength}
        barColor={(barHeight, bufferLength, index) =>
          `rgb(${barHeight}, ${bufferLength}, ${index})`
        }
      />
    </div>
  );
};
```

This is a setup for a simple usage. You can tweak the values and play around with it.

# Documentation

The types of this packages only come from the `src/types.ts` file.

````ts
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

/**
 * The possible arguments for the width of the bars
 * This could be a fixed number, or a function can be passed with the canvasWidth and
 * the buffer length, so it can be setted programmatically.
 */
type CustomBarWidthArg =
  | ((canvasWidth: number, bufferLength: number) => number)
  | number;

/**
 * The possible arguments for the height of the bars
 * This is a function that must return the actual number.
 * Note: this function gets called for each bar in the visualizer.
 */
type CustomBarHeightArg = (
  defaultHeight: number,
  bufferLength: number,
  index: number
) => number;

/**
 * The possible arguments for the color of the bars
 * This could be a CanvasGradient, CanvasPattern or a string.
 * Or it could be function that must return a CanvasGradient, CanvasPattern or a string.
 */
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
   * The length of the buffer
   */
  bufferLength: number;

  /**
   * The default x of the canvas
   */
  x: number;

  /**
   * The index of the currently drawn bar
   */
  index: number;
};

/**
 * A custom function that defines how each bar is drawn.
 * Note: this function gets called for each bar in the visualizer.
 * @param ctx The canvas context
 * @param args The necessary args to customize the drawing process
 * @see CustomDrawFunctionArgs
 */
type CustomDrawFunction = (
  ctx: CanvasRenderingContext2D,
  args: CustomDrawFunctionArgs
) => void;

type AudioVisualizerProps = ComponentPropsWithoutRef<"canvas"> & {
  /**
   * The source of the audio to visualize
   */
  src: string;

  /**
   * The current state of the audio source
   * @default "unset"
   * @see AudioState
   */
  audioState?: AudioState;

  /**
   * A callback that is called when the audio source changes state
   *
   * @param audioState The new state of the audio source
   * @example
   * ```tsx
   * const [audioState, setAudioState] = useState<AudioState>("unset");
   *
   * <AudioVisualizer
   *  src={src}
   *  audioState={audioState}
   *  onAudioStateChange={setAudioState}
   * />
   * ```
   */
  onAudioStateChange?: (audioState: AudioState) => void;

  /**
   * The interval in milliseconds at which the time elapesed is updated
   *
   * @default 1000
   * @example
   * ```tsx
   * <AudioVisualizer
   *  src={src}
   *  timeFactor={100}
   *  onTimeChange={time => console.log(time)} // This will log every 0.1 seconds
   * />
   * ```
   */
  timeFactor?: number;

  /**
   * Callback that is called when the time elapsed changes.
   *
   * @param time The current time elapsed in seconds
   */
  onTimeChange?: (time: number) => void;

  /**
   * Whether the audio should start playing as soon as it is loaded
   */
  autoStart?: boolean;

  /**
   * Whether the audio should loop
   */
  loop?: boolean;

  /**
   * The volume of the audio source
   * It should be a number between 0 and 1, error will be thrown otherwise
   *
   * @default 1
   * @example
   * ```tsx
   * const [volume, setVolume] = useState(1);
   *
   * <AudioVisualizer
   *  src={src}
   *  volume={volume}
   * />
   */
  volume?: number;

  /**
   * The number of frames to skip before updating the visualizer
   * This is used to save performance.
   * The higher the number, the less frequent the visualizer updates
   */
  stagger?: number;

  /**
   * The size of the Fast Fourier Transform (FFT) to use.
   * It should be a power of 2 between 32 and 32768
   * @see https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/fftSize
   *
   * @default 2048
   */
  fftSize?: number;

  /**
   * The speed at which the audio should play
   *
   * @default 1
   */
  playbackRate?: number;

  /**
   * The width of the bars. This could be a fixed number, or a function can be passed with the canvasWidth and
   * the buffer length, so it can be setted programmatically.
   *
   * @see CustomBarWidthArg
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
  customDrawFunction?: CustomDrawFunction;

  /**
   * Callback that is called when the audio source is loaded
   *
   * @param audio The audio element
   */
  onSourceLoaded?: (audio: HTMLAudioElement) => void;

  /**
   * Callback that is called when the audio source is paused
   *
   * @param audio The audio element
   */

  onSourceEnded?: (audio: HTMLAudioElement) => void;

  /**
   * Callback that is called when the audio source is paused
   *
   * @param audio The audio element
   */
  onSourcePaused?: (audio: HTMLAudioElement) => void;

  /**
   * Callback that is called when the audio source is playing
   *
   * @param audio The audio element
   */
  onSourcePlaying?: (audio: HTMLAudioElement) => void;

  /**
   * A ref to the canvas element
   */
  canvasRef?: RefObject<HTMLCanvasElement | null>;
};
````

# License

MIT License © Saverio Scagnoli 2024.
