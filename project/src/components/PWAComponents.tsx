import React, { useState, useEffect } from 'react';
import { Download, Wifi, WifiOff, RefreshCw, X, Smartphone, HardDrive, BarChart3, Clock } from 'lucide-react';
import { pwaManager, PWAStatus } from '../utils/pwaManager';
import { offlineManager } from '../utils/offlineManager';
import { pwaAudioManager } from '../utils/pwaAudioManager';

// PWA安装提示组件
export function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [pwaStatus, setPwaStatus] = useState<PWAStatus | null>(null);

  useEffect(() => {
    const unsubscribe = pwaManager.onStatusChange((status) => {
      setPwaStatus(status);
      setShowPrompt(status.isInstallable && !status.isInstalled);
    });

    return unsubscribe;
  }, []);

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      const success = await pwaManager.showInstallPrompt();
      if (success) {
        setShowPrompt(false);
      }
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // 24小时后再次显示
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // 检查是否在24小时内被忽略过
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const now = Date.now();
      const hoursPassed = (now - dismissedTime) / (1000 * 60 * 60);
      
      if (hoursPassed < 24) {
        setShowPrompt(false);
        return;
      }
    }
  }, []);

  if (!showPrompt || !pwaStatus?.isInstallable) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl shadow-lg p-4 border border-white/20">
        <div className="flex items-start gap-3">
          <div className="bg-white/20 p-2 rounded-full">
            <Smartphone className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-sm">安装到主屏幕</h3>
            <p className="text-xs opacity-90 mt-1">
              获得更快的启动速度和离线使用能力
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleInstall}
                disabled={isInstalling}
                className="bg-white text-indigo-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-100 disabled:opacity-50 flex items-center gap-1"
              >
                {isInstalling ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                  <Download className="h-3 w-3" />
                )}
                {isInstalling ? '安装中...' : '立即安装'}
              </button>
              <button
                onClick={handleDismiss}
                className="text-white/80 hover:text-white px-2 py-1.5 text-xs"
              >
                稍后再说
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white/60 hover:text-white p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// 网络状态指示器
export function NetworkStatus() {
  const [pwaStatus, setPwaStatus] = useState<PWAStatus | null>(null);

  useEffect(() => {
    const unsubscribe = pwaManager.onStatusChange(setPwaStatus);
    return unsubscribe;
  }, []);

  if (!pwaStatus) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
      pwaStatus.isOnline
        ? 'bg-green-100 text-green-700'
        : 'bg-amber-100 text-amber-700'
    }`}>
      {pwaStatus.isOnline ? (
        <>
          <Wifi className="h-3 w-3" />
          <span>在线</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3 animate-pulse" />
          <span>离线</span>
        </>
      )}
      {!pwaStatus.isOnline && (
        <span className="text-xs opacity-75">
          (使用缓存)
        </span>
      )}
    </div>
  );
}

// 更新提示组件
export function UpdatePrompt() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const unsubscribe = pwaManager.onStatusChange((status) => {
      setShowUpdate(status.hasUpdate);
    });

    return unsubscribe;
  }, []);

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await pwaManager.applyUpdate();
    } finally {
      setIsUpdating(false);
    }
  };

  if (!showUpdate) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 right-4 z-50 mx-auto max-w-sm">
      <div className="bg-blue-600 text-white rounded-xl shadow-lg p-4">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-5 w-5" />
          <div className="flex-1">
            <h3 className="font-bold text-sm">发现新版本</h3>
            <p className="text-xs opacity-90 mt-1">
              点击更新获得最新功能和改进
            </p>
          </div>
          <button
            onClick={handleUpdate}
            disabled={isUpdating}
            className="bg-white text-blue-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-100 disabled:opacity-50"
          >
            {isUpdating ? '更新中...' : '立即更新'}
          </button>
        </div>
      </div>
    </div>
  );
}

// 缓存状态组件
export function CacheStatus() {
  const [pwaStatus, setPwaStatus] = useState<PWAStatus | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const unsubscribe = pwaManager.onStatusChange(setPwaStatus);
    return unsubscribe;
  }, []);

  if (!pwaStatus) {
    return null;
  }

  const { cacheStatus } = pwaStatus;
  const totalSize = cacheStatus.totalCacheSize;

  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-center gap-2">
          <HardDrive className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">
            离线缓存
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {totalSize} 个文件
          </span>
          <div className={`w-2 h-2 rounded-full ${
            totalSize > 0 ? 'bg-green-500' : 'bg-gray-300'
          }`} />
        </div>
      </div>
      
      {showDetails && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">应用资源:</span>
              <span className="font-medium">{cacheStatus.appCacheSize} 个</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">音频文件:</span>
              <span className="font-medium">{cacheStatus.audioCacheSize} 个</span>
            </div>
          </div>
          
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => pwaManager.clearCache()}
              className="text-xs text-red-600 hover:text-red-700 font-medium"
            >
              清理缓存
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// PWA状态面板
export function PWAStatusPanel() {
  const [pwaStatus, setPwaStatus] = useState<PWAStatus | null>(null);

  useEffect(() => {
    const unsubscribe = pwaManager.onStatusChange(setPwaStatus);
    return unsubscribe;
  }, []);

  if (!pwaStatus) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800">应用状态</h3>
        <NetworkStatus />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-3 h-3 rounded-full ${
              pwaStatus.isInstalled ? 'bg-green-500' : 'bg-gray-300'
            }`} />
            <span className="text-sm font-medium">
              {pwaStatus.isInstalled ? '已安装' : '未安装'}
            </span>
          </div>
          <p className="text-xs text-gray-600">
            {pwaStatus.isInstalled 
              ? '应用已添加到主屏幕' 
              : '可以安装到主屏幕'
            }
          </p>
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-3 h-3 rounded-full ${
              pwaStatus.isOnline ? 'bg-green-500' : 'bg-amber-500'
            }`} />
            <span className="text-sm font-medium">
              {pwaStatus.isOnline ? '在线' : '离线'}
            </span>
          </div>
          <p className="text-xs text-gray-600">
            {pwaStatus.isOnline 
              ? '所有功能可用' 
              : '使用缓存内容'
            }
          </p>
        </div>
      </div>
      
      <CacheStatus />
      <LearningStats />
    </div>
  );
}

// 学习统计组件
export function LearningStats() {
  const [stats, setStats] = useState<any>(null);
  const [audioStats, setAudioStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const [learningStats, audioCache] = await Promise.all([
        offlineManager.getLearningStats(),
        pwaAudioManager.getCacheStatus()
      ]);

      setStats(learningStats);
      setAudioStats(audioCache);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">学习统计</span>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-gray-50 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">学习统计</span>
        </div>
        <p className="text-xs text-gray-500">暂无学习数据</p>
      </div>
    );
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">学习统计</span>
        </div>
        <button
          onClick={loadStats}
          className="text-xs text-blue-600 hover:text-blue-700"
        >
          刷新
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-white rounded-lg p-3">
          <div className="text-lg font-bold text-gray-800">{stats.totalScans}</div>
          <div className="text-xs text-gray-600">总扫描次数</div>
        </div>
        <div className="bg-white rounded-lg p-3">
          <div className="text-lg font-bold text-green-600">{stats.uniqueWords}</div>
          <div className="text-xs text-gray-600">学习单词数</div>
        </div>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-600">成功播放:</span>
          <span className="font-medium">{stats.successfulPlays}/{stats.totalScans}</span>
        </div>

        {audioStats && (
          <>
            <div className="flex justify-between">
              <span className="text-gray-600">缓存音频:</span>
              <span className="font-medium">{audioStats.diskCache} 个</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">内存缓存:</span>
              <span className="font-medium">{audioStats.memoryCache} 个</span>
            </div>
          </>
        )}

        {stats.audioSources && (
          <div className="pt-2 border-t border-gray-200">
            <div className="text-xs text-gray-600 mb-1">音频来源分布:</div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>缓存文件:</span>
                <span className="text-green-600">{stats.audioSources.cache}</span>
              </div>
              <div className="flex justify-between">
                <span>语音合成:</span>
                <span className="text-blue-600">{stats.audioSources.synthesis}</span>
              </div>
              <div className="flex justify-between">
                <span>播放失败:</span>
                <span className="text-red-600">{stats.audioSources.failed}</span>
              </div>
            </div>
          </div>
        )}

        {stats.lastActivity && (
          <div className="pt-2 border-t border-gray-200">
            <div className="flex items-center gap-1 text-gray-600">
              <Clock className="h-3 w-3" />
              <span>最后活动: {formatTime(stats.lastActivity)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
