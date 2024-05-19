import React, { useEffect, useRef, useState } from "react";

type CustomDrawFunctionArgs = {
  canvasWidth: number;
  canvasHeight: number;
  barWidth: number;
  barHeight: number;
  index: number;
  x: number;
};

type AudioVisualizerProps = React.ComponentPropsWithoutRef<"canvas"> & {
  src: string;
  autoStart?: boolean;
  stagger?: number;
  paused?: boolean;

  barWidth?: number | ((canvasWidth: number, freqLength: number) => number);
  barHeight?: (
    defaultHeight: number,
    index: number,
    freqLength: number
  ) => number;
  barColor?: (
    defaultHeight: number,
    index: number,
    freqLength: number
  ) => string;

  spaceBetweenBars?: number;
  fftSize?: number;

  customDrawFunction?: (
    ctx: CanvasRenderingContext2D,
    args: CustomDrawFunctionArgs
  ) => void;
};

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  src,
  autoStart = true,
  stagger = 1,
  paused = false,
  barWidth,
  barHeight,
  barColor,
  spaceBetweenBars = 1,
  fftSize = 2048,
  customDrawFunction,
  ...props
}) => {
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  let [frame, frameID] = [0, 0];

  const drawBars = (analyser: AnalyserNode, ctx: CanvasRenderingContext2D) => {
    frame++;

    if (frame % stagger !== 0) {
      frameID = requestAnimationFrame(() => drawBars(analyser, ctx));
      return;
    }

    const freq = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(freq);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

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

      let bh: number;

      if (barHeight) {
        bh = barHeight(defaultHeight, i, freq.length);
      } else {
        bh = defaultHeight;
      }

      let bc: string;

      if (barColor) {
        bc = barColor(i, defaultHeight, freq.length);
      } else {
        bc = "green";
      }

      ctx.fillStyle = bc;

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
   * Stop the music on unmount
   */
  useEffect(() => {
    const audioCtx = new AudioContext();
    setAudioCtx(audioCtx);

    return () => {
      if (sourceRef.current) {
        sourceRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (!audioCtx) return;

    if (paused) {
      audioCtx.suspend();
    } else {
      audioCtx.resume();
    }
  }, [paused, audioCtx]);

  useEffect(() => {
    if (!canvasRef.current || !audioCtx) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    const analyser = audioCtx.createAnalyser();

    analyser.fftSize = fftSize;

    fetch(src)
      .then(res => res.arrayBuffer())
      .then(arrayBuffer => audioCtx.decodeAudioData(arrayBuffer))
      .then(audioBuffer => {
        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;

        source.connect(analyser);
        analyser.connect(audioCtx.destination);

        void (autoStart && source.start());
        void (autoStart && drawBars(analyser, ctx));

        sourceRef.current = source;

        source.onended = () => {
          cancelAnimationFrame(frameID);
        };
      });
  }, [src, audioCtx]);

  return (
    <>
      <canvas {...props} ref={canvasRef} />
    </>
  );
};

export { AudioVisualizer };
