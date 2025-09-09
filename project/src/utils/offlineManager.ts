// 离线管理器 - 处理离线状态、数据同步、缓存策略
export interface OfflineData {
  id: string;
  type: 'scan' | 'learning' | 'error';
  timestamp: number;
  data: any;
  synced: boolean;
}

export interface LearningRecord {
  word: string;
  qrCode: string;
  timestamp: number;
  success: boolean;
  audioSource: 'cache' | 'synthesis' | 'failed';
  sessionId: string;
}

export class OfflineManager {
  private dbName = 'phonics-offline-db';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;
  private isOnline = navigator.onLine;
  private sessionId = this.generateSessionId();
  private syncQueue: OfflineData[] = [];
  private listeners: ((isOnline: boolean) => void)[] = [];

  constructor() {
    this.init();
    this.setupEventListeners();
  }

  // 初始化
  private async init(): Promise<void> {
    await this.initDB();
    await this.loadSyncQueue();
    
    // 如果在线，尝试同步
    if (this.isOnline) {
      this.syncPendingData();
    }
  }

  // 初始化IndexedDB
  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('[OfflineManager] Failed to open database');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('[OfflineManager] Database opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // 创建离线数据存储
        if (!db.objectStoreNames.contains('offlineData')) {
          const store = db.createObjectStore('offlineData', { keyPath: 'id' });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('synced', 'synced', { unique: false });
        }

        // 创建学习记录存储
        if (!db.objectStoreNames.contains('learningRecords')) {
          const store = db.createObjectStore('learningRecords', { keyPath: 'id', autoIncrement: true });
          store.createIndex('word', 'word', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('sessionId', 'sessionId', { unique: false });
        }

        console.log('[OfflineManager] Database schema created');
      };
    });
  }

  // 设置事件监听器
  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners();
      this.syncPendingData();
      console.log('[OfflineManager] Back online, syncing data...');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners();
      console.log('[OfflineManager] Gone offline, storing data locally...');
    });

    // 页面卸载时同步数据
    window.addEventListener('beforeunload', () => {
      if (this.isOnline && this.syncQueue.length > 0) {
        // 使用sendBeacon进行最后的数据同步
        this.sendBeaconSync();
      }
    });
  }

  // 生成会话ID
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 记录学习数据
  public async recordLearning(record: Omit<LearningRecord, 'sessionId'>): Promise<void> {
    const learningRecord: LearningRecord = {
      ...record,
      sessionId: this.sessionId
    };

    try {
      // 存储到本地数据库
      await this.storeData({
        id: `learning_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'learning',
        timestamp: Date.now(),
        data: learningRecord,
        synced: false
      });

      console.log('[OfflineManager] Learning record stored:', learningRecord);
    } catch (error) {
      console.error('[OfflineManager] Failed to record learning:', error);
    }
  }

  // 记录扫描数据
  public async recordScan(qrCode: string, result: string): Promise<void> {
    try {
      await this.storeData({
        id: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'scan',
        timestamp: Date.now(),
        data: { qrCode, result, sessionId: this.sessionId },
        synced: false
      });

      console.log('[OfflineManager] Scan record stored:', { qrCode, result });
    } catch (error) {
      console.error('[OfflineManager] Failed to record scan:', error);
    }
  }

  // 记录错误数据
  public async recordError(error: string, context: any): Promise<void> {
    try {
      await this.storeData({
        id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'error',
        timestamp: Date.now(),
        data: { error, context, sessionId: this.sessionId },
        synced: false
      });

      console.log('[OfflineManager] Error record stored:', { error, context });
    } catch (error) {
      console.error('[OfflineManager] Failed to record error:', error);
    }
  }

  // 存储数据到IndexedDB
  private async storeData(data: OfflineData): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offlineData'], 'readwrite');
      const store = transaction.objectStore('offlineData');
      const request = store.add(data);

      request.onsuccess = () => {
        this.syncQueue.push(data);
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // 加载待同步队列
  private async loadSyncQueue(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offlineData'], 'readonly');
      const store = transaction.objectStore('offlineData');
      const index = store.index('synced');
      const request = index.getAll(false);

      request.onsuccess = () => {
        this.syncQueue = request.result;
        console.log(`[OfflineManager] Loaded ${this.syncQueue.length} items to sync queue`);
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // 同步待处理数据
  private async syncPendingData(): Promise<void> {
    if (!this.isOnline || this.syncQueue.length === 0) {
      return;
    }

    console.log(`[OfflineManager] Syncing ${this.syncQueue.length} items...`);

    const syncPromises = this.syncQueue.map(async (item) => {
      try {
        const success = await this.syncSingleItem(item);
        if (success) {
          await this.markAsSynced(item.id);
          return true;
        }
        return false;
      } catch (error) {
        console.error('[OfflineManager] Sync failed for item:', item.id, error);
        return false;
      }
    });

    const results = await Promise.allSettled(syncPromises);
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
    
    console.log(`[OfflineManager] Sync completed: ${successCount}/${this.syncQueue.length} items synced`);
    
    // 重新加载同步队列
    await this.loadSyncQueue();
  }

  // 同步单个项目
  private async syncSingleItem(item: OfflineData): Promise<boolean> {
    try {
      // 这里可以根据不同类型的数据发送到不同的API端点
      const endpoint = this.getEndpointForType(item.type);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: item.id,
          type: item.type,
          timestamp: item.timestamp,
          data: item.data
        })
      });

      return response.ok;
    } catch (error) {
      console.error('[OfflineManager] Network sync failed:', error);
      return false;
    }
  }

  // 获取数据类型对应的API端点
  private getEndpointForType(type: string): string {
    const endpoints = {
      'learning': '/api/sync/learning',
      'scan': '/api/sync/scan',
      'error': '/api/sync/error'
    };
    
    return endpoints[type as keyof typeof endpoints] || '/api/sync/general';
  }

  // 标记为已同步
  private async markAsSynced(id: string): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offlineData'], 'readwrite');
      const store = transaction.objectStore('offlineData');
      const request = store.get(id);

      request.onsuccess = () => {
        const data = request.result;
        if (data) {
          data.synced = true;
          const updateRequest = store.put(data);
          
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  // 使用sendBeacon进行最后的同步
  private sendBeaconSync(): void {
    if (this.syncQueue.length === 0) return;

    const data = JSON.stringify({
      items: this.syncQueue.slice(0, 10), // 限制数量
      sessionId: this.sessionId
    });

    navigator.sendBeacon('/api/sync/beacon', data);
  }

  // 获取学习统计
  public async getLearningStats(): Promise<any> {
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offlineData'], 'readonly');
      const store = transaction.objectStore('offlineData');
      const index = store.index('type');
      const request = index.getAll('learning');

      request.onsuccess = () => {
        const records = request.result;
        const stats = this.calculateStats(records);
        resolve(stats);
      };

      request.onerror = () => reject(request.error);
    });
  }

  // 计算统计数据
  private calculateStats(records: OfflineData[]): any {
    const learningRecords = records.map(r => r.data as LearningRecord);
    
    return {
      totalScans: learningRecords.length,
      successfulPlays: learningRecords.filter(r => r.success).length,
      uniqueWords: new Set(learningRecords.map(r => r.word)).size,
      audioSources: {
        cache: learningRecords.filter(r => r.audioSource === 'cache').length,
        synthesis: learningRecords.filter(r => r.audioSource === 'synthesis').length,
        failed: learningRecords.filter(r => r.audioSource === 'failed').length
      },
      sessionsCount: new Set(learningRecords.map(r => r.sessionId)).size,
      lastActivity: Math.max(...learningRecords.map(r => r.timestamp))
    };
  }

  // 清理旧数据
  public async cleanupOldData(daysToKeep = 30): Promise<void> {
    if (!this.db) return;

    const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offlineData'], 'readwrite');
      const store = transaction.objectStore('offlineData');
      const index = store.index('timestamp');
      const range = IDBKeyRange.upperBound(cutoffTime);
      const request = index.openCursor(range);

      let deletedCount = 0;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          // 只删除已同步的旧数据
          if (cursor.value.synced) {
            cursor.delete();
            deletedCount++;
          }
          cursor.continue();
        } else {
          console.log(`[OfflineManager] Cleaned up ${deletedCount} old records`);
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  // 订阅在线状态变化
  public onOnlineStatusChange(callback: (isOnline: boolean) => void): () => void {
    this.listeners.push(callback);
    
    // 立即调用一次
    callback(this.isOnline);
    
    // 返回取消订阅函数
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // 通知监听器
  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback(this.isOnline);
      } catch (error) {
        console.error('[OfflineManager] Listener callback error:', error);
      }
    });
  }

  // 获取当前状态
  public getStatus() {
    return {
      isOnline: this.isOnline,
      pendingSyncCount: this.syncQueue.length,
      sessionId: this.sessionId,
      dbReady: !!this.db
    };
  }

  // 强制同步
  public async forcSync(): Promise<void> {
    if (this.isOnline) {
      await this.syncPendingData();
    }
  }
}

// 创建全局实例
export const offlineManager = new OfflineManager();
