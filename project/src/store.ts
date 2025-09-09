import { create } from 'zustand';
import { ScannerState } from './types';

export const useScannerStore = create<ScannerState>((set) => ({
  isScanning: false,
  lastScannedCode: null,
  lastSpokenTime: 0,
  error: null,
  audioStatus: 'idle',
  setScanning: (scanning) => set({ isScanning: scanning }),
  setLastScannedCode: (code) => set({ lastScannedCode: code }),
  setLastSpokenTime: (time) => set({ lastSpokenTime: time }),
  setError: (error) => set({ error }),
  setAudioStatus: (status) => set({ audioStatus: status }),
}));