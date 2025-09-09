import React, { useState, useEffect } from 'react';
import { PWAStatusPanel } from './PWAComponents';
import { pwaManager } from '../utils/pwaManager';
import { AudioManager } from '../utils/audioConfig';
import { Play, Download, Trash2, RefreshCw } from 'lucide-react';

export function PWATestPage() {
  const [audioManager] = useState(() => new AudioManager());
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);

  // 测试音频播放
  const testAudioPlayback = async (word: string) => {
    setIsLoading(true);
    try {
      const success = await audioManager.speak(word);
      setTestResults(prev => ({ ...prev, [word]: success }));
    } finally {
      setIsLoading(false);
    }
  };

  // 预加载测试音频
  const preloadTestAudio = async () => {
    setIsLoading(true);
    try {
      const testWords = ['got', 'hat', 'cat', 'dog', 'run'];
      await audioManager.preloadAudio(testWords);
      console.log('预加载完成');
    } finally {
      setIsLoading(false);
    }
  };

  // 清理缓存
  const clearAllCache = async () => {
    setIsLoading(true);
    try {
      await pwaManager.clearCache();
      setTestResults({});
      console.log('缓存已清理');
    } finally {
      setIsLoading(false);
    }
  };

  const testWords = [
    { word: 'got', label: 'Got (基础测试)' },
    { word: 'hat', label: 'Hat (基础测试)' },
    { word: 'hello', label: 'Hello (语音合成测试)' },
    { word: 'world', label: 'World (语音合成测试)' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            PWA 功能测试页面
          </h1>
          <p className="text-gray-600">
            这个页面用于测试PWA的各项功能，包括音频缓存、离线播放等。
          </p>
        </div>

        {/* PWA状态面板 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <PWAStatusPanel />
        </div>

        {/* 音频测试 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">音频播放测试</h2>
            <div className="flex gap-2">
              <button
                onClick={preloadTestAudio}
                disabled={isLoading}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                预加载音频
              </button>
              <button
                onClick={clearAllCache}
                disabled={isLoading}
                className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm"
              >
                <Trash2 className="h-4 w-4" />
                清理缓存
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testWords.map(({ word, label }) => (
              <div
                key={word}
                className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-800">{label}</h3>
                    <p className="text-sm text-gray-600">单词: {word}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {testResults[word] !== undefined && (
                      <div
                        className={`w-3 h-3 rounded-full ${
                          testResults[word] ? 'bg-green-500' : 'bg-red-500'
                        }`}
                        title={testResults[word] ? '播放成功' : '播放失败'}
                      />
                    )}
                    <button
                      onClick={() => testAudioPlayback(word)}
                      disabled={isLoading}
                      className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 text-sm"
                    >
                      <Play className="h-3 w-3" />
                      播放
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 测试结果 */}
        {Object.keys(testResults).length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">测试结果</h2>
            <div className="space-y-2">
              {Object.entries(testResults).map(([word, success]) => (
                <div
                  key={word}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  }`}
                >
                  <span className="font-medium">{word}</span>
                  <span
                    className={`text-sm font-medium ${
                      success ? 'text-green-700' : 'text-red-700'
                    }`}
                  >
                    {success ? '✅ 播放成功' : '❌ 播放失败'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 使用说明 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">测试说明</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <div>
              <strong>1. 音频缓存测试：</strong>
              <p>点击"预加载音频"按钮，系统会尝试下载并缓存测试音频文件。</p>
            </div>
            <div>
              <strong>2. 播放测试：</strong>
              <p>点击各个单词的"播放"按钮，测试不同的音频播放方式：</p>
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>缓存音频文件播放（如果存在）</li>
                <li>Web Speech API 语音合成</li>
              </ul>
            </div>
            <div>
              <strong>3. 离线测试：</strong>
              <p>断开网络连接后，测试缓存的音频是否仍能正常播放。</p>
            </div>
            <div>
              <strong>4. 移动端测试：</strong>
              <p>在手机浏览器中访问此页面，测试移动端的音频播放兼容性。</p>
            </div>
          </div>
        </div>

        {/* 开发者信息 */}
        <div className="bg-gray-100 rounded-xl p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-2">开发者信息</h2>
          <div className="text-sm text-gray-600 space-y-1">
            <p>PWA版本: {(window as any).__PWA_VERSION__ || '1.0.0'}</p>
            <p>构建时间: {(window as any).__BUILD_TIME__ || '未知'}</p>
            <p>用户代理: {navigator.userAgent}</p>
            <p>在线状态: {navigator.onLine ? '在线' : '离线'}</p>
            <p>Service Worker: {'serviceWorker' in navigator ? '支持' : '不支持'}</p>
            <p>Cache API: {'caches' in window ? '支持' : '不支持'}</p>
            <p>Web Speech API: {'speechSynthesis' in window ? '支持' : '不支持'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
