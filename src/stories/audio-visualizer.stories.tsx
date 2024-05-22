import { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { AudioVisualizer } from "..";
import { AudioState } from "../types";

const meta: Meta<typeof AudioVisualizer> = {
  title: "AudioVisualizer",
  component: AudioVisualizer
};

export default meta;

type Story = StoryObj<typeof AudioVisualizer>;

export const Default: Story = {
  render: () => {
    const [src, setSrc] = React.useState<string | null>(null);
    const [audioState, setAudioState] = React.useState<AudioState>("unset");

    const onClick = () => {
      setAudioState(audioState === "playing" ? "paused" : "playing");
    };

    const [time, setTime] = React.useState(0);
    const [duration, setDuration] = React.useState(0);
    const [stagger, setStagger] = React.useState(1);

    const [fftSize, setFftSize] = React.useState(256);
    const [playbackRate, setPlaybackRate] = React.useState(1);

    const [spaceBetweenBars, setSpaceBetweenBars] = React.useState(1);
    const [volume, setVolume] = React.useState(1);

    return (
      <div
        style={{
          width: "100%",
          height: "70vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label>Stagger:</label>
            <div style={{ display: "flex", gap: "1rem" }}>
              <button onClick={() => setStagger(s => s - 1)}>-</button>
              <span>{stagger}</span>
              <button onClick={() => setStagger(s => s + 1)}>+</button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label>Space between bars:</label>
            <div style={{ display: "flex", gap: "1rem" }}>
              <button onClick={() => setSpaceBetweenBars(s => s - 1)}>-</button>
              <span>{spaceBetweenBars}</span>
              <button onClick={() => setSpaceBetweenBars(s => s + 1)}>+</button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label>Volume:</label>
            <div style={{ display: "flex", gap: "1rem" }}>
              <button onClick={() => setVolume(s => +(s - 0.1).toFixed(1))}>
                -
              </button>
              <span>{volume}</span>
              <button onClick={() => setVolume(s => +(s + 0.1).toFixed(1))}>
                +
              </button>
            </div>
          </div>

          <div style={{ display: "flex", gap: "2rem" }}>
            <p>fftsize</p>
            <select value={fftSize} onChange={e => setFftSize(+e.target.value)}>
              {[32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384].map(size => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", gap: "2rem" }}>
            <p>playback rate</p>
            <select
              value={playbackRate}
              onChange={e => setPlaybackRate(+e.target.value)}
            >
              {[-1, 0.5, 1, 1.5, 2].map(rate => (
                <option key={rate} value={rate}>
                  {rate}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onClick}
            disabled={audioState === "unset" || audioState === "loading"}
          >
            {audioState}
          </button>
          <input
            type="file"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) {
                setAudioState("loading");
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => {
                  setSrc(reader.result?.toString() ?? "");
                };
              }
            }}
          />
          <p>
            {time} / {duration}
          </p>
          {src && (
            <AudioVisualizer
              src={src}
              width={700}
              height={300}
              audioState={audioState}
              onAudioStateChange={setAudioState}
              //autoStart={false}
              barWidth={4}
              timeFactor={100}
              stagger={stagger}
              fftSize={fftSize}
              spaceBetweenBars={spaceBetweenBars}
              playbackRate={playbackRate}
              volume={volume}
              onTimeChange={t => {
                const newTime = +t.toFixed(1);
                if (newTime !== time) {
                  setTime(newTime);
                }
              }}
              onSourceLoaded={audio => {
                setDuration(+audio.duration.toFixed(1));
                setTime(0);
              }}
              barColor={(h, l, i) => `hsl(${(1360 / l) * i}, ${h}%, 50%)`}
              customDrawFunction={(
                ctx,
                {
                  x,
                  barHeight,
                  barWidth,
                  canvasHeight,
                  canvasWidth,
                  index,
                  bufferLength
                }
              ) => {
                const threshold = 0.1;

                if (Math.abs(x) < threshold) {
                  ctx.fillRect(
                    canvasWidth / 2 - barWidth / 2,
                    canvasHeight - barHeight,
                    barWidth,
                    barHeight
                  );
                } else {
                  ctx.fillRect(
                    canvasWidth / 2 - x - barWidth / 2,
                    canvasHeight - barHeight,
                    barWidth,
                    barHeight
                  );

                  ctx.fillRect(
                    canvasWidth / 2 + x - barWidth / 2,
                    canvasHeight - barHeight,
                    barWidth,
                    barHeight
                  );
                }
              }}
            />
          )}
        </div>
      </div>
    );
  }
};
