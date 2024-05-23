<div align="center">
<img src="./docs/logo.gif">
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
