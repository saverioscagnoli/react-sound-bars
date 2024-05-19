import { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { AudioVisualizer } from "..";

const meta: Meta<typeof AudioVisualizer> = {
  title: "AudioVisualizer",
  component: AudioVisualizer
};

export default meta;

//import exampleAudio from "../assets/example.ogg";
//import sanctuaryGuardian from "../assets/sanctuary_guardian.mp3";

type Story = StoryObj<typeof AudioVisualizer>;

export const Default: Story = {
  render: ({
    src: _,

    ...props
  }) => {
    const [src, setSrc] = React.useState<string | null>(null);

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
            barWidth={(width, length) => (width / length) * 10}
            barHeight={val => val}
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
