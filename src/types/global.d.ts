
declare global {
  interface Window {
    playLokalSound?: (type: string) => void;
  }
}

export {};
