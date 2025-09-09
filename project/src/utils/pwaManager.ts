// PWA管理器 - 处理安装、更新、离线状态等
export interface PWAStatus {
  isInstalled: boolean;
  isInstallable: boolean;
  isOnline: boolean;
  hasUpdate: boolean;
  cacheStatus: {
    appCacheSize: number;
    audioCacheSize: number;
    totalCacheSize: number;
  };
}

export interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export class PWAManager {
  private deferredPrompt: InstallPromptEvent | null = null;
  private registration: ServiceWorkerRegistration | null = null;
  private statusCallbacks: ((status: PWAStatus) => void)[] = [];
  private status: PWAStatus = {
    isInstalled: false,
    isInstallable: false,
    isOnline: navigator.onLine,
    hasUpdate: false,
    cacheStatus: {
      appCacheSize: 0,
      audioCacheSize: 0,
      totalCacheSize: 0
    }
  };

  constructor() {
    this.init();
  }

  private async init() {
    // 检查是否已安装
    this.checkInstallStatus();
    
    // 注册Service Worker
    await this.registerServiceWorker();
    
    // 设置事件监听器
    this.setupEventListeners();
    
    // 获取缓存状态
    await this.updateCacheStatus();
    
    // 通知状态更新
    this.notifyStatusChange();
  }

  // 注册Service Worker
  private async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });

        console.log('[PWA] Service Worker registered:', this.registration);

        // 检查更新
        this.registration.addEventListener('updatefound', () => {
          const newWorker = this.registration!.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                this.status.hasUpdate = true;
                this.notifyStatusChange();
              }
            });
          }
        });

        // 监听控制器变化
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload();
        });

      } catch (error) {
        console.error('[PWA] Service Worker registration failed:', error);
      }
    }
  }

  // 设置事件监听器
  private setupEventListeners(): void {
    // 安装提示事件
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e as InstallPromptEvent;
      this.status.isInstallable = true;
      this.notifyStatusChange();
    });

    // 应用安装事件
    window.addEventListener('appinstalled', () => {
      this.status.isInstalled = true;
      this.status.isInstallable = false;
      this.deferredPrompt = null;
      this.notifyStatusChange();
      console.log('[PWA] App installed successfully');
    });

    // 网络状态变化
    window.addEventListener('online', () => {
      this.status.isOnline = true;
      this.notifyStatusChange();
    });

    window.addEventListener('offline', () => {
      this.status.isOnline = false;
      this.notifyStatusChange();
    });
  }

  // 检查安装状态
  private checkInstallStatus(): void {
    // 检查是否在standalone模式运行
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;
    
    this.status.isInstalled = isStandalone || isIOSStandalone;
  }

  // 更新缓存状态
  private async updateCacheStatus(): Promise<void> {
    if (this.registration && this.registration.active) {
      try {
        const messageChannel = new MessageChannel();
        
        const response = await new Promise<any>((resolve) => {
          messageChannel.port1.onmessage = (event) => {
            resolve(event.data);
          };
          
          this.registration!.active!.postMessage(
            { type: 'GET_CACHE_STATUS' },
            [messageChannel.port2]
          );
        });

        this.status.cacheStatus = response;
        this.notifyStatusChange();
      } catch (error) {
        console.error('[PWA] Failed to get cache status:', error);
      }
    }
  }

  // 显示安装提示
  public async showInstallPrompt(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }

    try {
      await this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;
      
      this.deferredPrompt = null;
      this.status.isInstallable = false;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('[PWA] User accepted install prompt');
        return true;
      } else {
        console.log('[PWA] User dismissed install prompt');
        return false;
      }
    } catch (error) {
      console.error('[PWA] Install prompt failed:', error);
      return false;
    }
  }

  // 应用更新
  public async applyUpdate(): Promise<void> {
    if (this.registration && this.registration.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }

  // 预缓存音频文件
  public async precacheAudio(audioUrls: string[]): Promise<void> {
    if (!('caches' in window)) {
      return;
    }

    try {
      const cache = await caches.open('phonics-audio-v1.0.0');
      
      const cachePromises = audioUrls.map(async (url) => {
        try {
          const response = await fetch(url);
          if (response.ok) {
            await cache.put(url, response);
            console.log(`[PWA] Cached audio: ${url}`);
          }
        } catch (error) {
          console.warn(`[PWA] Failed to cache audio: ${url}`, error);
        }
      });

      await Promise.allSettled(cachePromises);
      await this.updateCacheStatus();
    } catch (error) {
      console.error('[PWA] Audio precaching failed:', error);
    }
  }

  // 检查音频是否已缓存
  public async isAudioCached(audioUrl: string): Promise<boolean> {
    if (!('caches' in window)) {
      return false;
    }

    try {
      const cache = await caches.open('phonics-audio-v1.0.0');
      const response = await cache.match(audioUrl);
      return !!response;
    } catch (error) {
      return false;
    }
  }

  // 获取缓存的音频
  public async getCachedAudio(audioUrl: string): Promise<Blob | null> {
    if (!('caches' in window)) {
      return null;
    }

    try {
      const cache = await caches.open('phonics-audio-v1.0.0');
      const response = await cache.match(audioUrl);
      
      if (response) {
        return await response.blob();
      }
      
      return null;
    } catch (error) {
      console.error('[PWA] Failed to get cached audio:', error);
      return null;
    }
  }

  // 清理缓存
  public async clearCache(): Promise<void> {
    if (!('caches' in window)) {
      return;
    }

    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      
      await this.updateCacheStatus();
      console.log('[PWA] All caches cleared');
    } catch (error) {
      console.error('[PWA] Failed to clear cache:', error);
    }
  }

  // 订阅状态变化
  public onStatusChange(callback: (status: PWAStatus) => void): () => void {
    this.statusCallbacks.push(callback);
    
    // 立即调用一次
    callback(this.status);
    
    // 返回取消订阅函数
    return () => {
      const index = this.statusCallbacks.indexOf(callback);
      if (index > -1) {
        this.statusCallbacks.splice(index, 1);
      }
    };
  }

  // 通知状态变化
  private notifyStatusChange(): void {
    this.statusCallbacks.forEach(callback => {
      try {
        callback({ ...this.status });
      } catch (error) {
        console.error('[PWA] Status callback error:', error);
      }
    });
  }

  // 获取当前状态
  public getStatus(): PWAStatus {
    return { ...this.status };
  }

  // 检查PWA支持
  public static isSupported(): boolean {
    return 'serviceWorker' in navigator && 'caches' in window;
  }
}

// 创建全局实例
export const pwaManager = new PWAManager();
