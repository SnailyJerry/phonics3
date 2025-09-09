export interface QRCodeMapping {
  [key: string]: string;
}

export interface ScannerState {
  isScanning: boolean;
  lastScannedCode: string | null;
  lastSpokenTime: number;
  error: string | null;
  audioStatus: 'idle' | 'playing' | 'failed';
  setScanning: (scanning: boolean) => void;
  setLastScannedCode: (code: string | null) => void;
  setLastSpokenTime: (time: number) => void;
  setError: (error: string | null) => void;
  setAudioStatus: (status: 'idle' | 'playing' | 'failed') => void;
}