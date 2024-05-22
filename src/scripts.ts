import {
  AudioState,
  CustomBarColorArg,
  CustomBarHeightArg,
  CustomBarWidthArg,
  CustomDrawFunction
} from "./types";

/**
 * Loads an audio source and connects it to an analyser node
 *
 * @param src The source of the audio to visualize
 * @param audioContext The audio context to use
 * @param analyser The analyser node to use
 * @param setAudioState The function to set the audio state
 * @param onLoad The function to call when the audio is loaded
 * @param onEnded The function to call when the audio ends
 * @returns An HTMLAudioElement with the source set to `src`
 */
function load(
  src: string,
  audioContext: AudioContext,
  analyser: AnalyserNode,
  setAudioState: (audioState: AudioState) => void,
  onLoad: () => void,
  onEnded: () => void
): HTMLAudioElement {
  const audio = new Audio(src);

  audio.onloadedmetadata = onLoad;
  audio.onended = onEnded;

  const source = audioContext.createMediaElementSource(audio);

  source.connect(analyser);
  source.connect(audioContext.destination);

  setAudioState("pending");

  return audio;
}

/**
 * Function to create the animation handlers
 * The handlers are 2 functions, one starts the animation and the other stops it
 * Must be used in pair
 *
 * @param analyser The analyser node to use
 * @param canvas The reference to the canvas element
 * @param stagger The number of frames to skip before drawing
 * @param barWidth The width of each bar
 * @param barHeight The height of each bar
 * @param barColor The color of each bar
 * @param spaceBetweenBars The space between each bar
 * @param drawFunction The draw function to use
 * @returns A tuple of functions.
 */
function createAnimationHandlers(
  analyser: AnalyserNode,
  canvas: HTMLCanvasElement,
  stagger: number,
  barWidth: CustomBarWidthArg,
  barHeight: CustomBarHeightArg,
  barColor: CustomBarColorArg,
  spaceBetweenBars: number,
  drawFunction: CustomDrawFunction
): [() => void, () => void] {
  let frameID: number;
  let frame = 0;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas 2D context is not supported");
  }

  const getBarWidth = typeof barWidth === "function" ? barWidth : () => barWidth;
  const getBarColor = typeof barColor === "function" ? barColor : () => barColor;

  const draw = () => {
    frame++;

    if (frame % stagger !== 0) {
      frameID = requestAnimationFrame(draw);
      return;
    }

    let buffer = new Uint8Array(analyser.frequencyBinCount);

    analyser.getByteFrequencyData(buffer);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let bw = getBarWidth(canvas.width, buffer.length);

    let x = 0;

    for (let i = 0; i < buffer.length; i++) {
      let bh = barHeight(buffer[i], buffer.length, i);

      ctx.fillStyle = getBarColor(bh, buffer.length, i);

      drawFunction(ctx, {
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        barWidth: bw,
        barHeight: bh,
        x,
        bufferLength: buffer.length,
        index: i
      });

      x += bw + spaceBetweenBars;
    }

    frameID = requestAnimationFrame(draw);
  };

  const stop = () => cancelAnimationFrame(frameID);

  return [draw, stop];
}

export { createAnimationHandlers, load };
