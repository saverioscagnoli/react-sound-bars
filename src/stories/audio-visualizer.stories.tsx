import { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { AudioVisualizer } from "..";
import { AudioState } from "../types";

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

        case "pending":
        case "paused": {
          setAudioState("playing");
          break;
        }

        case "ended": {
          setAudioState("playing");
          break;
        }
      }
    };

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
        <button
          onClick={onClick}
          disabled={["unset", "loading"].includes(audioState)}
        >
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
            autoStart={false}
            //  fftSize={256}
            barHeight={defaultHeight => defaultHeight}
            barWidth={(w, l) => (w / l) * 10}
            {...props}
          />
        )}
      </div>
    );
  }
};
