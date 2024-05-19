import React, { useEffect, useRef, useState } from "react";

type AudioVisualizerProps = React.ComponentPropsWithoutRef<"canvas"> & {
  src: string;
  autoStart?: boolean;
  stagger?: number;
  paused?: boolean;

  barWidth?: number | ((canvasWidth: number, freqLength: number) => number);
  barHeight?: (val: number, index: number, freqLength: number) => number;
  barColor?: (val: number, index: number, freqLength: number) => string;
};

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  src,
  autoStart = true,
  stagger = 1,
  paused = false,
  barWidth,
  barHeight,
  barColor,
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
      const val = freq.at(i) || freq[i];

      let bh: number;

      if (barHeight) {
        bh = barHeight(val, i, freq.length);
      } else {
        bh = val * 0.5;
      }

      let bc: string;

      if (barColor) {
        bc = barColor(i, val, freq.length);
      } else {
        bc = "green";
      }

      ctx.fillStyle = bc;
      ctx.fillRect(ctx.canvas.width / 2 - x, ctx.canvas.height - bh, bw, bh);
      ctx.fillRect(ctx.canvas.width / 2 + x, ctx.canvas.height - bh, bw, bh);
      x += bw;
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

    analyser.fftSize = 256;

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
