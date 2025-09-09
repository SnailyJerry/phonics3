import React, { useState } from 'react';
import { Scanner } from './components/Scanner';
import { InstallPrompt, UpdatePrompt } from './components/PWAComponents';
import { QrCode, Sparkles, BookOpen, Gamepad2, Volume2 } from 'lucide-react';

function App() {
  const [showGuide, setShowGuide] = useState(false);
  const [showGame, setShowGame] = useState(false);
  const [showPhonics, setShowPhonics] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50">
      <header className="bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/icons/蜗牛叔叔-自然拼读网站-logo.png"
                alt="蜗牛叔叔logo"
                className="w-10 h-10 rounded-full object-cover"
              />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                蜗牛自然拼读卡牌桌游
              </h1>
              <Sparkles className="h-5 w-5 text-yellow-400 animate-pulse" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-4 sm:py-8 sm:px-6 lg:px-8">
        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg border border-purple-100">
          <div className="max-w-4xl mx-auto p-4 sm:p-6">
            <Scanner />

            {/* 功能入口区域 */}
            <div className="mt-6 sm:mt-8">
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                {/* 指导说明 */}
                <div
                  onClick={() => setShowGuide(true)}
                  className="bg-white/80 backdrop-blur rounded-xl p-3 sm:p-6 border border-indigo-100 hover:border-indigo-200 transition-all cursor-pointer hover:shadow-lg group"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 bg-indigo-100 rounded-full mb-2 sm:mb-4 group-hover:bg-indigo-200 transition-colors">
                      <BookOpen className="h-4 w-4 sm:h-6 sm:w-6 text-indigo-600" />
                    </div>
                    <h3 className="text-sm sm:text-lg font-bold text-indigo-700 mb-1 sm:mb-2">指导说明</h3>
                    <p className="text-xs sm:text-sm text-indigo-600 mb-2 sm:mb-4 hidden sm:block">详细使用教程和最佳实践</p>
                    <button className="px-2 py-1 sm:px-4 sm:py-2 bg-indigo-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-indigo-700 transition-colors">
                      点击进入
                    </button>
                  </div>
                </div>

                {/* 示范视频 */}
                <div
                  onClick={() => setShowGame(true)}
                  className="bg-white/80 backdrop-blur rounded-xl p-3 sm:p-6 border border-purple-100 hover:border-purple-200 transition-all cursor-pointer hover:shadow-lg group"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 bg-purple-100 rounded-full mb-2 sm:mb-4 group-hover:bg-purple-200 transition-colors">
                      <Gamepad2 className="h-4 w-4 sm:h-6 sm:w-6 text-purple-600" />
                    </div>
                    <h3 className="text-sm sm:text-lg font-bold text-purple-700 mb-1 sm:mb-2">示范视频</h3>
                    <p className="text-xs sm:text-sm text-purple-600 mb-2 sm:mb-4 hidden sm:block">互动练习和挑战模式</p>
                    <button className="px-2 py-1 sm:px-4 sm:py-2 bg-purple-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-purple-700 transition-colors">
                      观看视频
                    </button>
                  </div>
                </div>

                {/* 音素示范 */}
                <div
                  onClick={() => setShowPhonics(true)}
                  className="bg-white/80 backdrop-blur rounded-xl p-3 sm:p-6 border border-orange-100 hover:border-orange-200 transition-all cursor-pointer hover:shadow-lg group"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 bg-orange-100 rounded-full mb-2 sm:mb-4 group-hover:bg-orange-200 transition-colors">
                      <Volume2 className="h-4 w-4 sm:h-6 sm:w-6 text-orange-600" />
                    </div>
                    <h3 className="text-sm sm:text-lg font-bold text-orange-700 mb-1 sm:mb-2">音素示范</h3>
                    <p className="text-xs sm:text-sm text-orange-600 mb-2 sm:mb-4 hidden sm:block">标准发音和口型演示</p>
                    <button className="px-2 py-1 sm:px-4 sm:py-2 bg-orange-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-orange-700 transition-colors">
                      听音素
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 sm:mt-8 bg-blue-50 rounded-xl p-3 sm:p-6">
              <h2 className="text-lg font-bold text-indigo-700 flex items-center gap-2 mb-3">
                使用说明
              </h2>
              <ul className="space-y-2">
                {[
                  '允许摄像头权限并启用声音',
                  '将二维码对准摄像头中央',
                  '系统自动识别并播放发音'
                ].map((instruction, index) => (
                  <li key={index} className="flex items-center gap-3 text-indigo-600">
                    <span className="flex items-center justify-center w-6 h-6 bg-indigo-100 rounded-full text-sm font-medium">
                      {index + 1}
                    </span>
                    <span>{instruction}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* PWA组件 */}
      <InstallPrompt />
      <UpdatePrompt />

      {/* 功能模态窗口 */}
      {showGuide && (
        <GuideModal onClose={() => setShowGuide(false)} />
      )}

      {showGame && (
        <GameModal onClose={() => setShowGame(false)} />
      )}

      {showPhonics && (
        <PhonicsModal onClose={() => setShowPhonics(false)} />
      )}
    </div>
  );
}

// 指导说明模态窗口
function GuideModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-indigo-700 flex items-center gap-2">
              <BookOpen className="h-6 w-6" />
              指导说明
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ✕
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">📱 基础使用</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• 首次使用需要允许摄像头权限</li>
                <li>• 点击"启用声音"激活音频功能</li>
                <li>• 将卡片上的二维码对准摄像头中央</li>
                <li>• 系统会自动识别并播放发音</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">🎯 使用技巧</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• 保持卡片平整，避免反光</li>
                <li>• 距离摄像头15-30cm为最佳</li>
                <li>• 确保光线充足但不要过亮</li>
                <li>• 快速切换卡片时音频会自动切换</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">❓ 常见问题</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• 无法识别：检查二维码是否清晰完整</li>
                <li>• 没有声音：确认音量开启且已点击"启用声音"</li>
                <li>• 识别缓慢：改善光线条件或调整距离</li>
                <li>• 音频重叠：等待当前音频播放完成</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 示范视频模态窗口
function GameModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-purple-700 flex items-center gap-2">
              <Gamepad2 className="h-6 w-6" />
              示范视频
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ✕
            </button>
          </div>

          <div className="text-center py-12">
            <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Gamepad2 className="h-12 w-12 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-4">视频功能开发中</h3>
            <p className="text-gray-600 mb-6">
              我们正在开发专业的示范视频，包括：
            </p>
            <ul className="text-left max-w-md mx-auto space-y-2 text-gray-600">
              <li>🎯 单词发音示范视频</li>
              <li>🏆 口型动作详细演示</li>
              <li>📈 分级学习视频教程</li>
              <li>🎮 互动练习视频</li>
            </ul>
            <p className="text-sm text-gray-500 mt-6">敬请期待下个版本！</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// 音素示范模态窗口
function PhonicsModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-orange-700 flex items-center gap-2">
              <Volume2 className="h-6 w-6" />
              音素示范
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ✕
            </button>
          </div>

          <div className="text-center py-12">
            <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Volume2 className="h-12 w-12 text-orange-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-4">音素功能开发中</h3>
            <p className="text-gray-600 mb-6">
              我们正在开发专业的音素示范功能，包括：
            </p>
            <ul className="text-left max-w-md mx-auto space-y-2 text-gray-600">
              <li>🗣️ 44个英语音素标准发音</li>
              <li>👄 口型动画演示</li>
              <li>🎵 音素对比练习</li>
              <li>📚 发音技巧说明</li>
            </ul>
            <p className="text-sm text-gray-500 mt-6">敬请期待下个版本！</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;