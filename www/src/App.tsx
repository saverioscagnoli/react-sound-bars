import { useState } from "react";
import { Button } from "~/components/tredici";

function App() {
  const [src, setSrc] = useState<string | null>(null);

  return <Button>Zio delle!</Button>;
}

export default App;
