// 音频配置管理工具
export interface AudioConfig {
  rate: number;
  volume: number;
  pitch: number;
  preferredVoice?: string;
  fallbackEnabled: boolean;
  retryAttempts: number;
  retryDelay: number;
}

export interface BrowserAudioSupport {
  speechSynthesis: boolean;
  audioContext: boolean;
  autoplay: boolean;
  userGestureRequired: boolean;
  recommendedSettings: AudioConfig;
}

// 检测浏览器音频支持情况
export const detectAudioSupport = (): BrowserAudioSupport => {
  const userAgent = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
  const isWeChat = /MicroMessenger/.test(userAgent);
  const isAndroid = /Android/.test(userAgent);
  const isChrome = /Chrome/.test(userAgent);

  // 基础支持检测
  const speechSynthesis = 'speechSynthesis' in window;
  const audioContext = 'AudioContext' in window || 'webkitAudioContext' in window;

  // 根据浏览器类型返回配置
  if (isIOS && isSafari) {
    return {
      speechSynthesis,
      audioContext,
      autoplay: false,
      userGestureRequired: true,
      recommendedSettings: {
        rate: 0.7,
        volume: 1.0,
        pitch: 1.0,
        fallbackEnabled: true,
        retryAttempts: 3,
        retryDelay: 1000,
      }
    };
  }

  if (isWeChat) {
    return {
      speechSynthesis: speechSynthesis && false, // 微信内置浏览器限制
      audioContext: false,
      autoplay: false,
      userGestureRequired: true,
      recommendedSettings: {
        rate: 0.8,
        volume: 1.0,
        pitch: 1.0,
        fallbackEnabled: true,
        retryAttempts: 1,
        retryDelay: 2000,
      }
    };
  }

  if (isAndroid && isChrome) {
    return {
      speechSynthesis,
      audioContext,
      autoplay: true,
      userGestureRequired: false,
      recommendedSettings: {
        rate: 0.8,
        volume: 1.0,
        pitch: 1.0,
        fallbackEnabled: true,
        retryAttempts: 2,
        retryDelay: 500,
      }
    };
  }

  // 默认桌面浏览器配置
  return {
    speechSynthesis,
    audioContext,
    autoplay: true,
    userGestureRequired: false,
    recommendedSettings: {
      rate: 0.9,
      volume: 1.0,
      pitch: 1.0,
      fallbackEnabled: false,
      retryAttempts: 1,
      retryDelay: 300,
    }
  };
};

// 获取最佳语音选择
export const getBestVoice = (preferredLang = 'en-US'): SpeechSynthesisVoice | null => {
  const voices = speechSynthesis.getVoices();
  
  // 优先选择本地语音
  const localVoice = voices.find(voice => 
    voice.lang.startsWith(preferredLang.split('-')[0]) && voice.localService
  );
  
  if (localVoice) return localVoice;
  
  // 回退到任何匹配语言的语音
  const anyVoice = voices.find(voice => 
    voice.lang.startsWith(preferredLang.split('-')[0])
  );
  
  return anyVoice || null;
};

// 音频播放状态管理
export class AudioManager {
  private config: AudioConfig;
  private support: BrowserAudioSupport;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private audioCache: Map<string, Blob> = new Map();
  private preloadQueue: string[] = [];
  private currentAudio: HTMLAudioElement | null = null; // 当前播放的音频
  private isPlaying: boolean = false; // 播放状态
  private isPreloading: boolean = false;

  constructor() {
    this.support = detectAudioSupport();
    this.config = this.support.recommendedSettings;
    this.initializeAudioCache();
  }

  // 初始化音频缓存
  private async initializeAudioCache(): Promise<void> {
    if ('caches' in window) {
      try {
        const cache = await caches.open('phonics-audio-v1.0.0');
        const cachedRequests = await cache.keys();

        console.log(`[AudioManager] Found ${cachedRequests.length} cached audio files`);
      } catch (error) {
        console.error('[AudioManager] Failed to initialize audio cache:', error);
      }
    }
  }

  async speak(text: string): Promise<boolean> {
    try {
      console.log(`[AudioManager] Starting speak for "${text}"`);

      // 1. 尝试播放缓存的音频文件
      const cachedAudio = await this.getCachedAudio(text);
      console.log(`[AudioManager] getCachedAudio result for "${text}":`, cachedAudio ? 'Found' : 'Not found');

      if (cachedAudio) {
        console.log(`[AudioManager] Playing cached audio for "${text}"`);
        return await this.playAudioBlob(cachedAudio);
      }

      // 2. 尝试Web Speech API
      if (this.support.speechSynthesis) {
        console.log(`[AudioManager] Using speech synthesis for "${text}"`);
        return await this.speakWithSynthesis(text);
      }

      console.warn('No audio playback method available');
      return false;
    } catch (error) {
      console.error('Audio playback failed:', error);
      return false;
    }
  }

  // 使用Web Speech API播放
  private async speakWithSynthesis(text: string): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        // 停止当前播放
        this.stop();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = this.config.rate;
        utterance.volume = this.config.volume;
        utterance.pitch = this.config.pitch;
        utterance.lang = 'en-US';

        // 设置最佳语音
        const bestVoice = getBestVoice();
        if (bestVoice) {
          utterance.voice = bestVoice;
        }

        utterance.onend = () => {
          this.currentUtterance = null;
          resolve(true);
        };

        utterance.onerror = (event) => {
          console.error('Speech synthesis error:', event);
          this.currentUtterance = null;
          resolve(false);
        };

        this.currentUtterance = utterance;
        speechSynthesis.speak(utterance);
      } catch (error) {
        console.error('Speech synthesis failed:', error);
        resolve(false);
      }
    });
  }

  // 停止当前播放的音频
  private stopCurrentAudio(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    this.isPlaying = false;
  }

  // 播放音频Blob (支持快速切换)
  private async playAudioBlob(audioBlob: Blob): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        // 停止当前播放的音频（如果有的话）
        if (this.currentAudio) {
          this.currentAudio.pause();
          this.currentAudio.currentTime = 0;
        }

        const audio = new Audio();
        const audioUrl = URL.createObjectURL(audioBlob);

        audio.src = audioUrl;
        audio.volume = this.config.volume;

        // 设置为当前音频
        this.currentAudio = audio;
        this.isPlaying = true;

        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          if (this.currentAudio === audio) {
            this.currentAudio = null;
            this.isPlaying = false;
          }
          resolve(true);
        };

        audio.onerror = (error) => {
          console.error('Audio playback error:', error);
          URL.revokeObjectURL(audioUrl);
          if (this.currentAudio === audio) {
            this.currentAudio = null;
            this.isPlaying = false;
          }
          resolve(false);
        };

        // 尝试播放音频
        audio.play().then(() => {
          console.log(`[AudioManager] Successfully started playing audio`);
        }).catch((error) => {
          console.error('Audio play() failed:', error);
          URL.revokeObjectURL(audioUrl);
          if (this.currentAudio === audio) {
            this.currentAudio = null;
            this.isPlaying = false;
          }
          resolve(false);
        });
      } catch (error) {
        console.error('Audio blob playback failed:', error);
        this.isPlaying = false;
        resolve(false);
      }
    });
  }

  // 获取缓存的音频
  private async getCachedAudio(text: string): Promise<Blob | null> {
    // 尝试从不同级别的文件夹中查找音频文件
    const possiblePaths = [
      `/audio/L1audio/${text.toLowerCase()}.mp3`,
      `/audio/L2audio/${text.toLowerCase()}.mp3`,
      `/audio/L3audio/${text.toLowerCase()}.mp3`
    ];

    // 依次尝试每个可能的路径
    for (const audioUrl of possiblePaths) {
      // 先检查内存缓存
      if (this.audioCache.has(audioUrl)) {
        const cachedBlob = this.audioCache.get(audioUrl)!;
        // 验证缓存的音频文件是否完整
        if (this.validateAudioBlob(cachedBlob)) {
          console.log(`[AudioManager] Using memory cached audio for "${text}" from ${audioUrl}`);
          return cachedBlob;
        } else {
          console.warn(`[AudioManager] Invalid memory cached audio for "${text}", removing`);
          this.audioCache.delete(audioUrl);
        }
      }

      // 检查Cache API
      if ('caches' in window) {
        try {
          const cache = await caches.open('phonics-audio-v1.0.0');
          const response = await cache.match(audioUrl);

          if (response) {
            const audioBlob = await response.blob();

            // 验证音频文件
            if (this.validateAudioBlob(audioBlob)) {
              // 存入内存缓存
              this.audioCache.set(audioUrl, audioBlob);
              console.log(`[AudioManager] Using disk cached audio for "${text}" from ${audioUrl}`);
              return audioBlob;
            } else {
              console.warn(`[AudioManager] Invalid disk cached audio for "${text}", removing`);
              await cache.delete(audioUrl);
            }
          }
        } catch (error) {
          console.error(`[AudioManager] Failed to get cached audio for "${text}" from ${audioUrl}:`, error);
        }
      }

      // 尝试从网络获取音频文件
      try {
        console.log(`[AudioManager] Trying to fetch audio from network: ${audioUrl}`);
        const response = await fetch(audioUrl);

        if (response.ok) {
          const audioBlob = await response.blob();

          // 验证音频文件
          if (this.validateAudioBlob(audioBlob)) {
            // 存入内存缓存
            this.audioCache.set(audioUrl, audioBlob);

            // 存入Cache API
            if ('caches' in window) {
              try {
                const cache = await caches.open('phonics-audio-v1.0.0');
                await cache.put(audioUrl, new Response(audioBlob));
              } catch (cacheError) {
                console.warn(`[AudioManager] Failed to cache audio for "${text}":`, cacheError);
              }
            }

            console.log(`[AudioManager] Successfully fetched and cached audio for "${text}" from ${audioUrl}`);
            return audioBlob;
          }
        }
      } catch (error) {
        console.error(`[AudioManager] Failed to fetch audio for "${text}" from ${audioUrl}:`, error);
      }
    }

    console.log(`[AudioManager] No valid cached audio found for "${text}"`);
    return null;
  }

  // 验证音频Blob是否有效
  private validateAudioBlob(blob: Blob): boolean {
    // 基本验证：检查文件大小和类型
    if (!blob || blob.size === 0) {
      return false;
    }

    // 检查文件大小（音频文件应该至少有几KB）
    if (blob.size < 1000) {
      console.warn('[AudioManager] Audio file too small:', blob.size, 'bytes');
      return false;
    }

    return true;
  }

  // 预加载音频文件
  public async preloadAudio(words: string[]): Promise<void> {
    if (this.isPreloading) {
      return;
    }

    this.isPreloading = true;
    this.preloadQueue = [...words];

    try {
      const audioUrls = words.map(word => `/audio/${word.toLowerCase()}.mp3`);

      // 并发预加载，但限制并发数
      const concurrency = 3;
      for (let i = 0; i < audioUrls.length; i += concurrency) {
        const batch = audioUrls.slice(i, i + concurrency);
        await Promise.allSettled(
          batch.map(url => this.preloadSingleAudio(url))
        );
      }
    } finally {
      this.isPreloading = false;
      this.preloadQueue = [];
    }
  }

  // 预加载单个音频文件
  private async preloadSingleAudio(audioUrl: string): Promise<void> {
    try {
      // 检查是否已缓存
      if (await this.isAudioCached(audioUrl)) {
        return;
      }

      // 下载并缓存
      const response = await fetch(audioUrl);
      if (response.ok) {
        const audioBlob = await response.blob();

        // 存入内存缓存
        this.audioCache.set(audioUrl, audioBlob);

        // 存入Cache API
        if ('caches' in window) {
          const cache = await caches.open('phonics-audio-v1.0.0');
          await cache.put(audioUrl, new Response(audioBlob));
        }

        console.log(`[AudioManager] Preloaded: ${audioUrl}`);
      }
    } catch (error) {
      console.warn(`[AudioManager] Failed to preload: ${audioUrl}`, error);
    }
  }

  // 检查音频是否已缓存
  private async isAudioCached(audioUrl: string): Promise<boolean> {
    // 检查内存缓存
    if (this.audioCache.has(audioUrl)) {
      return true;
    }

    // 检查Cache API
    if ('caches' in window) {
      try {
        const cache = await caches.open('phonics-audio-v1.0.0');
        const response = await cache.match(audioUrl);
        return !!response;
      } catch (error) {
        return false;
      }
    }

    return false;
  }

  stop(): void {
    // 停止TTS语音合成
    if (this.currentUtterance) {
      speechSynthesis.cancel();
      this.currentUtterance = null;
    }

    // 停止HTML音频播放
    this.stopCurrentAudio();
  }

  isSupported(): boolean {
    return this.support.speechSynthesis;
  }

  requiresUserGesture(): boolean {
    return this.support.userGestureRequired;
  }

  getConfig(): AudioConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<AudioConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}
