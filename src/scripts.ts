import { MutableRefObject } from "react";
import {
  AudioState,
  CustomBarColorArg,
  CustomBarHeightArg,
  CustomBarWidthArg,
  CustomDrawFunctionArgs
} from "./types";

async function loadAudioSource(
  src: string,
  audioContext: AudioContext,
  analyser: AnalyserNode,
  onAudioStateChange: (state: AudioState) => void
): Promise<AudioBufferSourceNode> {
  onAudioStateChange("loading");

  const res = await fetch(src);
  const arrayBuffer = await res.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;

  source.connect(audioContext.destination);
  source.connect(analyser);

  return source;
}

function startAudioSource(
  source: AudioBufferSourceNode,
  startAnimation: () => void,
  currentTime: number,
  startTime: MutableRefObject<number>,
  pauseTime: MutableRefObject<number>
) {
  source.start();
  startAnimation();
  startTime.current = currentTime - pauseTime.current;
}

async function loadAndEmitAudioSource(
  src: string,
  audioContext: AudioContext,
  analyser: AnalyserNode,
  sourceRef: MutableRefObject<AudioBufferSourceNode | null>,
  onSourceEnded: (() => void) | undefined,
  onAudioStateChange: (state: AudioState) => void,
  onSourceLoaded: () => void
) {
  const source = await loadAudioSource(
    src,
    audioContext,
    analyser,
    onAudioStateChange
  );

  sourceRef.current = source;

  source.onended = () => {
    onSourceEnded?.();
    onAudioStateChange("ended");
  };

  onSourceLoaded();
}

const createAnimationHandlers = (
  analyser: AnalyserNode,
  ctx: CanvasRenderingContext2D,
  stagger: number,
  barWidth: CustomBarWidthArg,
  barHeight: CustomBarHeightArg,
  barColor: CustomBarColorArg,
  drawFunction: (ctx: CanvasRenderingContext2D, args: CustomDrawFunctionArgs) => void
) => {
  let frameID: number;
  let frame = 0;

  const draw = () => {
    frame++;

    if (frame % stagger !== 0) {
      frameID = requestAnimationFrame(draw);
      return;
    }

    const buffer = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(buffer);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    /**
     * Check for user customization and set bar width accordingly
     */
    let bw =
      typeof barWidth === "function"
        ? barWidth(ctx.canvas.width, buffer.length)
        : barWidth;

    let x = 0;

    for (let i = 0; i < buffer.length; i++) {
      const defaultHeight = buffer[i];

      /**
       * Check for user customization and set bar height and color accordingly
       */
      let bh = barHeight(defaultHeight, buffer.length, i);

      /**
       * Check for user customization and set bar color accordingly
       */
      let bc =
        typeof barColor === "function" ? barColor(bh, defaultHeight, i) : barColor;

      ctx.fillStyle = bc;

      drawFunction(ctx, {
        canvasHeight: ctx.canvas.height,
        canvasWidth: ctx.canvas.width,
        barWidth: bw,
        barHeight: bh,
        x,
        index: i
      });

      x += bw + 1;
    }

    frameID = requestAnimationFrame(draw);
  };

  return [() => cancelAnimationFrame(frameID), draw] as const;
};

export {
  createAnimationHandlers,
  loadAndEmitAudioSource,
  loadAudioSource,
  startAudioSource
};
