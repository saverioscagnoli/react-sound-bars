import { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { AudioState, AudioVisualizer } from "..";

const meta: Meta<typeof AudioVisualizer> = {
  title: "AudioVisualizer",
  component: AudioVisualizer
};

export default meta;

type Story = StoryObj<typeof AudioVisualizer>;

export const Default: Story = {
  render: ({ src: _, audioState: _1, onAudioStateChange: _2, ...props }) => {
    const [src, setSrc] = React.useState<string | null>(null);
    const [audioState, setAudioState] = useState<AudioState>("unset");

    const onClick = () => {
      switch (audioState) {
        case "playing": {
          setAudioState("paused");

          break;
        }

        case "paused": {
          setAudioState("playing");

          break;
        }

        case "ended": {
          setAudioState("playing");
        }
      }
    };

    console.log(audioState);

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
        <button onClick={onClick} disabled={audioState === "unset"}>
          {audioState}
        </button>
        <input
          type="file"
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.readAsDataURL(file);
              reader.onload = () => {
                setSrc(reader.result?.toString() ?? "");
              };
            }
          }}
        />

        {src && (
          <AudioVisualizer
            src={src}
            width={800}
            height={400}
            audioState={audioState}
            onAudioStateChange={setAudioState}
            autoStart={true}
            barWidth={(width, length) => (width / length) * 10}
            barHeight={defaultHeight => defaultHeight}
            barColor={(height, index, length) => {
              const r = height + 25 * (index / length);
              const g = 250 * (index / length);
              const b = 50;

              return `rgb(${r}, ${g}, ${b})`;
            }}
            customDrawFunction={(ctx, { x, barWidth, barHeight }) => {
              ctx.fillRect(
                ctx.canvas.width / 2 - x,
                ctx.canvas.height - barHeight,
                barWidth,
                barHeight
              );
              ctx.fillRect(
                ctx.canvas.width / 2 + x,
                ctx.canvas.height - barHeight,
                barWidth,
                barHeight
              );
            }}
            {...props}
          />
        )}
      </div>
    );
  }
};
