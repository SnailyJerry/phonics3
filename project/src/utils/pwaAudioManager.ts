// PWA增强音频管理器 - 集成离线功能和数据记录
import { AudioManager } from './audioConfig';
import { offlineManager } from './offlineManager';
import { pwaManager } from './pwaManager';

export interface AudioPlayResult {
  success: boolean;
  source: 'cache' | 'synthesis' | 'failed';
  duration?: number;
  error?: string;
}

export class PWAAudioManager extends AudioManager {
  private playHistory: Map<string, number> = new Map();
  private preloadProgress: Map<string, 'pending' | 'loading' | 'loaded' | 'failed'> = new Map();
  private currentAudioElement: HTMLAudioElement | null = null; // 当前播放的音频元素
  private currentAudioUrl: string | null = null; // 当前音频的URL

  constructor() {
    super();
    this.initializePWAFeatures();
  }

  // 初始化PWA特性
  private async initializePWAFeatures(): Promise<void> {
    // 监听在线状态变化
    offlineManager.onOnlineStatusChange((isOnline) => {
      if (isOnline) {
        this.syncPreloadQueue();
      }
    });

    // 预加载核心词汇
    await this.preloadCoreVocabulary();
  }

  // 增强的音频播放方法
  public async speak(text: string, qrCode?: string): Promise<AudioPlayResult> {
    const startTime = Date.now();
    let result: AudioPlayResult;

    try {
      // 0. 确保音频上下文处于活跃状态（移动端重要）
      await this.ensureAudioContextActive();

      // 1. 只播放专业制作的音频文件
      const cachedAudio = await this.getCachedAudio(text);
      if (cachedAudio) {
        const success = await this.playAudioBlobWithRetry(cachedAudio, text);
        result = {
          success,
          source: 'professional_audio',
          duration: Date.now() - startTime
        };
      } else {
        // 2. 没有专业音频时，提示音频准备中
        console.warn(`[PWAAudioManager] No professional audio found for "${text}"`);
        result = {
          success: false,
          source: 'audio_not_ready',
          duration: Date.now() - startTime,
          error: `专业拼读音频准备中，请稍后再试`
        };
      }

      // 记录播放历史
      this.recordPlayHistory(text);

      // 记录学习数据
      await this.recordLearningData(text, qrCode, result);

      return result;

    } catch (error) {
      result = {
        success: false,
        source: 'failed',
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      // 记录错误
      await offlineManager.recordError('Audio playback failed', {
        text,
        qrCode,
        error: result.error
      });

      return result;
    }
  }

  // 带重试的音频播放方法
  private async playAudioBlobWithRetry(audioBlob: Blob, word: string, maxRetries = 2): Promise<boolean> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      console.log(`[PWAAudioManager] Playing "${word}", attempt ${attempt + 1}/${maxRetries + 1}`);

      const success = await this.playAudioBlob(audioBlob);
      if (success) {
        if (attempt > 0) {
          console.log(`[PWAAudioManager] "${word}" succeeded on retry ${attempt}`);
        }
        return true;
      }

      if (attempt < maxRetries) {
        console.warn(`[PWAAudioManager] "${word}" failed, retrying in 300ms...`);
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    console.error(`[PWAAudioManager] "${word}" failed after ${maxRetries + 1} attempts`);
    return false;
  }

  // 增强的音频Blob播放方法 (支持快速切换)
  private async playAudioBlob(audioBlob: Blob): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        // 停止当前播放的音频（如果有的话）
        if (this.currentAudioElement && !this.currentAudioElement.paused) {
          console.log('[PWAAudioManager] Stopping current audio for new playback');
          this.currentAudioElement.pause();
        }

        const audio = new Audio();
        const audioUrl = URL.createObjectURL(audioBlob);

        // 设置为当前音频
        this.currentAudioElement = audio;
        this.currentAudioUrl = audioUrl;

        audio.src = audioUrl;
        audio.volume = this.config.volume;
        audio.preload = 'auto';

        // 添加详细的事件监听
        audio.onloadeddata = () => {
          console.log('[PWAAudioManager] Audio data loaded successfully');
        };

        audio.onended = () => {
          console.log('[PWAAudioManager] Audio playback ended successfully');
          if (this.currentAudioUrl === audioUrl) {
            URL.revokeObjectURL(audioUrl);
            this.currentAudioElement = null;
            this.currentAudioUrl = null;
          }
          resolve(true);
        };

        audio.onerror = (event) => {
          console.error('[PWAAudioManager] Audio error:', event);
          if (this.currentAudioUrl === audioUrl) {
            URL.revokeObjectURL(audioUrl);
            this.currentAudioElement = null;
            this.currentAudioUrl = null;
          }
          resolve(false);
        };

        audio.onabort = () => {
          console.warn('[PWAAudioManager] Audio playback aborted');
          if (this.currentAudioUrl === audioUrl) {
            URL.revokeObjectURL(audioUrl);
            this.currentAudioElement = null;
            this.currentAudioUrl = null;
          }
          resolve(false);
        };

        // 尝试播放
        const playPromise = audio.play();

        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('[PWAAudioManager] Audio play started successfully');
            })
            .catch((error) => {
              console.error('[PWAAudioManager] Audio play promise failed:', error.name, error.message);
              // 常见错误类型分析
              if (error.name === 'NotAllowedError') {
                console.error('[PWAAudioManager] Audio play blocked by browser policy');
              } else if (error.name === 'NotSupportedError') {
                console.error('[PWAAudioManager] Audio format not supported');
              } else if (error.name === 'AbortError') {
                console.error('[PWAAudioManager] Audio play aborted');
              }
              URL.revokeObjectURL(audioUrl);
              resolve(false);
            });
        }

        // 设置超时，防止无限等待
        setTimeout(() => {
          if (audio.currentTime === 0 && !audio.ended) {
            console.warn('[PWAAudioManager] Audio play timeout after 5 seconds');
            audio.pause();
            URL.revokeObjectURL(audioUrl);
            resolve(false);
          }
        }, 5000);

      } catch (error) {
        console.error('[PWAAudioManager] Audio blob playback failed:', error);
        resolve(false);
      }
    });
  }

  // 确保音频上下文处于活跃状态（移动端关键）
  private async ensureAudioContextActive(): Promise<void> {
    try {
      // 方法1: 尝试恢复AudioContext
      if (typeof AudioContext !== 'undefined' || typeof (window as any).webkitAudioContext !== 'undefined') {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContextClass();

        if (audioContext.state === 'suspended') {
          console.log('[PWAAudioManager] Resuming suspended audio context');
          await audioContext.resume();
        }

        audioContext.close(); // 清理临时上下文
      }

      // 方法2: 播放一个静音音频来激活音频系统
      const silentAudio = new Audio();
      silentAudio.volume = 0;
      silentAudio.muted = true;

      // 创建一个1ms的静音音频URL
      const silentAudioData = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT';
      silentAudio.src = silentAudioData;

      const playPromise = silentAudio.play();
      if (playPromise) {
        await playPromise.catch(() => {}); // 忽略错误
      }

      console.log('[PWAAudioManager] Audio context activation attempted');
    } catch (error) {
      console.warn('[PWAAudioManager] Audio context activation failed:', error);
      // 不抛出错误，继续尝试播放
    }
  }

  // 记录播放历史
  private recordPlayHistory(text: string): void {
    const count = this.playHistory.get(text) || 0;
    this.playHistory.set(text, count + 1);
  }

  // 记录学习数据
  private async recordLearningData(
    text: string, 
    qrCode: string | undefined, 
    result: AudioPlayResult
  ): Promise<void> {
    try {
      await offlineManager.recordLearning({
        word: text,
        qrCode: qrCode || 'unknown',
        timestamp: Date.now(),
        success: result.success,
        audioSource: result.source
      });
    } catch (error) {
      console.error('[PWAAudioManager] Failed to record learning data:', error);
    }
  }

  // 预加载核心词汇
  private async preloadCoreVocabulary(): Promise<void> {
    const coreWords = [
      'got', 'hat', 'cat', 'dog', 'run', 'sun', 'fun', 'big', 'red', 'blue',
      'yes', 'no', 'go', 'stop', 'hello', 'goodbye', 'please', 'thank', 'you'
    ];

    console.log('[PWAAudioManager] Starting core vocabulary preload...');
    
    // 分批预加载，避免网络拥塞
    const batchSize = 3;
    for (let i = 0; i < coreWords.length; i += batchSize) {
      const batch = coreWords.slice(i, i + batchSize);
      await this.preloadBatch(batch);
      
      // 小延迟，避免过度占用网络
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('[PWAAudioManager] Core vocabulary preload completed');
  }

  // 批量预加载
  private async preloadBatch(words: string[]): Promise<void> {
    const promises = words.map(word => this.preloadSingleWord(word));
    await Promise.allSettled(promises);
  }

  // 预加载单个词汇
  private async preloadSingleWord(word: string): Promise<void> {
    const audioUrl = `/audio/${word.toLowerCase()}.mp3`;
    
    if (this.preloadProgress.get(audioUrl) === 'loaded') {
      return;
    }

    this.preloadProgress.set(audioUrl, 'loading');

    try {
      // 检查是否已缓存
      if (await this.isAudioCached(audioUrl)) {
        this.preloadProgress.set(audioUrl, 'loaded');
        return;
      }

      // 尝试下载
      const response = await fetch(audioUrl);
      if (response.ok) {
        const audioBlob = await response.blob();
        
        // 存入缓存
        await this.cacheAudioBlob(audioUrl, audioBlob);
        this.preloadProgress.set(audioUrl, 'loaded');
        
        console.log(`[PWAAudioManager] Preloaded: ${word}`);
      } else {
        this.preloadProgress.set(audioUrl, 'failed');
      }
    } catch (error) {
      this.preloadProgress.set(audioUrl, 'failed');
      console.warn(`[PWAAudioManager] Failed to preload: ${word}`, error);
    }
  }

  // 缓存音频Blob
  private async cacheAudioBlob(audioUrl: string, audioBlob: Blob): Promise<void> {
    // 存入内存缓存
    this.audioCache.set(audioUrl, audioBlob);
    
    // 存入Cache API
    if ('caches' in window) {
      try {
        const cache = await caches.open('phonics-audio-v1.0.0');
        await cache.put(audioUrl, new Response(audioBlob));
      } catch (error) {
        console.warn('[PWAAudioManager] Failed to cache audio:', error);
      }
    }
  }

  // 智能预加载 - 根据使用频率预测
  public async smartPreload(currentWord: string): Promise<void> {
    const relatedWords = this.getRelatedWords(currentWord);
    const priorityWords = this.getPriorityWords(relatedWords);
    
    // 后台预加载相关词汇
    setTimeout(() => {
      this.preloadBatch(priorityWords);
    }, 1000);
  }

  // 获取相关词汇
  private getRelatedWords(word: string): string[] {
    const wordFamilies: Record<string, string[]> = {
      'cat': ['hat', 'bat', 'rat', 'mat'],
      'hat': ['cat', 'bat', 'rat', 'mat'],
      'dog': ['log', 'fog', 'hog'],
      'run': ['sun', 'fun', 'gun'],
      'big': ['pig', 'dig', 'fig'],
      'red': ['bed', 'led', 'fed'],
      'blue': ['true', 'glue', 'clue']
    };

    return wordFamilies[word.toLowerCase()] || [];
  }

  // 获取优先词汇（基于使用频率）
  private getPriorityWords(words: string[]): string[] {
    return words
      .map(word => ({
        word,
        frequency: this.playHistory.get(word) || 0
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5)
      .map(item => item.word);
  }

  // 获取预加载进度
  public getPreloadProgress(): Record<string, string> {
    const progress: Record<string, string> = {};
    this.preloadProgress.forEach((status, url) => {
      const word = url.split('/').pop()?.replace('.mp3', '') || url;
      progress[word] = status;
    });
    return progress;
  }

  // 获取播放统计
  public getPlayStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    this.playHistory.forEach((count, word) => {
      stats[word] = count;
    });
    return stats;
  }

  // 同步预加载队列（在线时）
  private async syncPreloadQueue(): Promise<void> {
    const failedWords = Array.from(this.preloadProgress.entries())
      .filter(([_, status]) => status === 'failed')
      .map(([url, _]) => url.split('/').pop()?.replace('.mp3', '') || '');

    if (failedWords.length > 0) {
      console.log('[PWAAudioManager] Retrying failed preloads:', failedWords);
      await this.preloadBatch(failedWords);
    }
  }

  // 清理缓存
  public async clearAudioCache(): Promise<void> {
    // 清理内存缓存
    this.audioCache.clear();
    
    // 清理预加载进度
    this.preloadProgress.clear();
    
    // 清理播放历史
    this.playHistory.clear();
    
    // 清理Cache API
    if ('caches' in window) {
      try {
        await caches.delete('phonics-audio-v1.0.0');
        console.log('[PWAAudioManager] Audio cache cleared');
      } catch (error) {
        console.error('[PWAAudioManager] Failed to clear cache:', error);
      }
    }
  }

  // 获取缓存状态
  public async getCacheStatus(): Promise<{
    memoryCache: number;
    diskCache: number;
    preloadProgress: Record<string, string>;
    playStats: Record<string, number>;
  }> {
    let diskCacheCount = 0;
    
    if ('caches' in window) {
      try {
        const cache = await caches.open('phonics-audio-v1.0.0');
        const keys = await cache.keys();
        diskCacheCount = keys.length;
      } catch (error) {
        console.error('[PWAAudioManager] Failed to get cache status:', error);
      }
    }

    return {
      memoryCache: this.audioCache.size,
      diskCache: diskCacheCount,
      preloadProgress: this.getPreloadProgress(),
      playStats: this.getPlayStats()
    };
  }

  // 预热音频系统
  public async warmupAudioSystem(): Promise<void> {
    try {
      // 播放静音音频以激活音频系统
      const silentUtterance = new SpeechSynthesisUtterance('');
      silentUtterance.volume = 0;
      speechSynthesis.speak(silentUtterance);
      
      // 等待语音引擎准备就绪
      await new Promise<void>((resolve) => {
        if (speechSynthesis.getVoices().length > 0) {
          resolve();
        } else {
          speechSynthesis.addEventListener('voiceschanged', () => resolve(), { once: true });
        }
      });
      
      console.log('[PWAAudioManager] Audio system warmed up');
    } catch (error) {
      console.error('[PWAAudioManager] Audio warmup failed:', error);
    }
  }


}

// 创建全局实例
export const pwaAudioManager = new PWAAudioManager();
