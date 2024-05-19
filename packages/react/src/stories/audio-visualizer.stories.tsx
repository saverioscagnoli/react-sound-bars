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
import onett from "../assets/onett.mp3";

type Story = StoryObj<typeof AudioVisualizer>;

export const Default: Story = {
  render: ({
    src = onett,

    ...props
  }) => {
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
        <AudioVisualizer
          src={src}
          width={800}
          height={400}
          barHeight={val => val * 0.75}
          {...props}
        />
      </div>
    );
  }
};
