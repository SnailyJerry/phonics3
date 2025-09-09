import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Camera, Volume2, AlertTriangle, RefreshCw, Shield } from 'lucide-react';
import { useScannerStore } from '../store';
import { QR_CODE_MAPPINGS, SCAN_INTERVAL, REPEAT_DELAY } from '../constants';
import { detectAudioSupport } from '../utils/audioConfig';
import { pwaAudioManager } from '../utils/pwaAudioManager';
import { offlineManager } from '../utils/offlineManager';

// 浏览器兼容性检测
const getBrowserInfo = () => {
  const userAgent = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
  const isWeChat = /MicroMessenger/.test(userAgent);
  const isAndroid = /Android/.test(userAgent);
  const isChrome = /Chrome/.test(userAgent);

  return { isIOS, isSafari, isWeChat, isAndroid, isChrome };
};

export function Scanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [browserWarning, setBrowserWarning] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false);
  const [needsHttps, setNeedsHttps] = useState(false);
  const {
    isScanning,
    lastScannedCode,
    lastSpokenTime,
    error,
    audioStatus,
    setScanning,
    setLastScannedCode,
    setLastSpokenTime,
    setError,
    setAudioStatus,
  } = useScannerStore();

  // 检查是否是蜗牛自然拼读卡片
  const isSnailyPhonicsCard = (qrContent: string): boolean => {
    // 蜗牛卡片的二维码格式：snailyqrL1xxx, snailyqrL2xxx, snailyqrL3xxx
    return /^snailyqr(L[1-3])[a-zA-Z]+$/.test(qrContent);
  };

  // 检查浏览器兼容性和初始化音频管理器
  useEffect(() => {
    const { isIOS, isSafari, isWeChat, isAndroid } = getBrowserInfo();
    const audioSupport = detectAudioSupport();

    // 监听离线状态
    const unsubscribeOffline = offlineManager.onOnlineStatusChange(setIsOffline);

    // 设置浏览器警告
    if (isWeChat) {
      setBrowserWarning('微信浏览器可能存在音频播放限制，建议在Safari或Chrome中打开');
    } else if (isIOS && isSafari) {
      setBrowserWarning('iOS Safari对音频有严格限制，请确保设备音量已开启');
    } else if (!audioSupport.speechSynthesis) {
      setBrowserWarning('当前浏览器不支持语音合成，建议使用Chrome浏览器');
    } else if (audioSupport.userGestureRequired) {
      setBrowserWarning('需要用户交互才能播放音频，请点击启用声音按钮');
    }

    return () => {
      unsubscribeOffline();
    };
  }, []);

  const playAudio = async (text: string, qrCode?: string) => {
    try {
      setAudioStatus('playing');

      // 使用PWA音频管理器播放
      const result = await pwaAudioManager.speak(text, qrCode);

      if (result.success) {
        setAudioStatus('idle');

        // 智能预加载相关词汇
        await pwaAudioManager.smartPreload(text);
      } else {
        setAudioStatus('failed');

        // 根据不同的失败原因显示不同的错误信息
        let errorMessage = '';
        if (result.source === 'audio_not_ready') {
          errorMessage = `"${text}" 的专业拼读音频正在准备中，请稍后再试`;
        } else {
          errorMessage = `音频播放失败: ${text}`;
        }

        setError(errorMessage);
        setTimeout(() => {
          setError(null);
          setAudioStatus('idle');
        }, 4000); // 延长显示时间，让用户看清提示
      }

      // 记录扫描数据
      if (qrCode) {
        await offlineManager.recordScan(qrCode, text);
      }
    } catch (error) {
      console.error('音频播放失败:', error);
      setAudioStatus('failed');
      setError(`播放失败: ${text}`);
      setTimeout(() => {
        setError(null);
        setAudioStatus('idle');
      }, 3000);
    }
  };

  const initializeAudio = async () => {
    try {
      // 预热音频系统
      await pwaAudioManager.warmupAudioSystem();

      // 检查是否支持语音合成
      if (!pwaAudioManager.isSupported()) {
        throw new Error('浏览器不支持语音合成功能');
      }

      // 预加载语音合成，确保在用户交互后可以正常工作
      const utterance = new SpeechSynthesisUtterance('');
      utterance.volume = 0; // 静音测试
      speechSynthesis.speak(utterance);

      // 等待语音引擎准备就绪
      await new Promise((resolve) => {
        if (speechSynthesis.getVoices().length > 0) {
          resolve(true);
        } else {
          speechSynthesis.addEventListener('voiceschanged', resolve, { once: true });
        }
      });

      setAudioEnabled(true);
      setBrowserWarning(null); // 清除警告
    } catch (error) {
      console.error('音频初始化失败:', error);
      setError('音频功能初始化失败，请检查浏览器设置');
    }
  };

  // 手动启动摄像头
  const startCameraManually = async () => {
    try {
      setCameraPermissionDenied(false);
      setError(null);

      const constraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setScanning(true);
          setError(null);
          console.log('[Scanner] Camera started manually');
        };
      }
    } catch (err: any) {
      console.error('Manual camera start error:', err);

      if (err.name === 'NotAllowedError') {
        setCameraPermissionDenied(true);
        setError('摄像头权限被拒绝，请在浏览器设置中允许摄像头访问，然后刷新页面');
      } else {
        setError('无法启动摄像头：' + (err.message || '未知错误'));
      }
    }
  };

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        // 检查是否支持摄像头API
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('此浏览器不支持摄像头功能');
        }

        // 检查是否为HTTPS环境（本地开发除外）
        const isSecure = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
        if (!isSecure) {
          setNeedsHttps(true);
          throw new Error('摄像头功能需要HTTPS环境');
        }

        // 请求摄像头权限，优先后置摄像头
        const constraints = {
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 }
          }
        };

        stream = await navigator.mediaDevices.getUserMedia(constraints);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          // 等待视频加载
          videoRef.current.onloadedmetadata = () => {
            setScanning(true);
            setError(null);
            console.log('[Scanner] Camera started successfully');
          };
        }
      } catch (err: any) {
        console.error('Camera access error:', err);

        let errorMessage = '无法访问摄像头';

        if (err.name === 'NotAllowedError') {
          errorMessage = '摄像头权限被拒绝，请点击下方按钮重新授权';
          setCameraPermissionDenied(true);
        } else if (err.name === 'NotFoundError') {
          errorMessage = '未找到摄像头设备';
        } else if (err.name === 'NotSupportedError') {
          errorMessage = '浏览器不支持摄像头功能';
        } else if (err.name === 'NotReadableError') {
          errorMessage = '摄像头被其他应用占用';
        } else if (err.message.includes('HTTPS')) {
          errorMessage = err.message;
        }

        setError(errorMessage);
        setScanning(false);
      }
    };

    // 延迟启动摄像头，给页面加载时间
    const timer = setTimeout(startCamera, 500);

    return () => {
      clearTimeout(timer);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      setScanning(false);
    };
  }, []);

  useEffect(() => {
    if (!isScanning) return;

    const scanQRCode = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) return;

      const context = canvas.getContext('2d');
      if (!context) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        const now = Date.now();
        if (code.data !== lastScannedCode || now - lastSpokenTime > REPEAT_DELAY) {
          // 检查是否是蜗牛拼读卡片
          if (isSnailyPhonicsCard(code.data)) {
            const sentence = QR_CODE_MAPPINGS[code.data];
            if (sentence) {
              setLastScannedCode(code.data);
              setLastSpokenTime(now);

              if (audioEnabled) {
                playAudio(sentence, code.data);
              } else {
                // 音频未启用时的提示
                setError(`识别到单词"${sentence}"，请先点击"启用声音"按钮来播放音频`);
                setTimeout(() => setError(null), 4000);
              }
            } else {
              // 是蜗牛卡片但映射表中没有
              setError(`这张卡片暂未收录，请联系客服添加`);
              setTimeout(() => setError(null), 3000);
            }
          } else {
            // 不是蜗牛拼读卡片
            setError(`这不是蜗牛自然拼读卡片，请扫描正确的卡片`);
            setTimeout(() => setError(null), 3000);
          }
        }
      }
    };

    const interval = setInterval(scanQRCode, SCAN_INTERVAL);
    return () => clearInterval(interval);
  }, [isScanning, lastScannedCode, lastSpokenTime, audioEnabled]);

  return (
    <div className="relative w-full">
      {/* HTTPS要求提示 */}
      {needsHttps && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-red-800 font-medium">需要HTTPS环境</p>
              <p className="text-sm text-red-700 mt-1">
                摄像头功能需要安全连接。请使用以下方式之一：
              </p>
              <ul className="text-xs text-red-600 mt-2 space-y-1">
                <li>• 生成HTTPS证书：运行 <code className="bg-red-100 px-1 rounded">bash generate-certs.sh</code></li>
                <li>• 使用ngrok：<code className="bg-red-100 px-1 rounded">ngrok http 5173</code></li>
                <li>• 访问：<code className="bg-red-100 px-1 rounded">https://localhost:5173</code></li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 浏览器兼容性警告 */}
      {browserWarning && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-amber-800 font-medium">浏览器兼容性提示</p>
              <p className="text-sm text-amber-700 mt-1">{browserWarning}</p>
            </div>
            <button
              onClick={() => setBrowserWarning(null)}
              className="text-amber-600 hover:text-amber-800 ml-auto"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {!audioEnabled && (
        <div
          onClick={initializeAudio}
          className="absolute inset-0 z-10 bg-gradient-to-b from-indigo-600/90 to-purple-600/90 flex flex-col items-center justify-center text-white cursor-pointer rounded-2xl"
        >
          <div className="bg-white/20 p-6 rounded-full mb-4">
            <Volume2 size={48} className="text-white" />
          </div>
          <p className="text-xl font-bold">点击启用声音</p>
          <p className="text-sm opacity-90 mt-2">需要与页面互动来启用声音功能</p>
        </div>
      )}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full aspect-[4/3] object-cover rounded-2xl shadow-lg border-4 border-white"
      />
      <canvas
        ref={canvasRef}
        className="hidden"
      />
      {error && (
        <div className="absolute top-0 left-0 right-0 bg-red-500/90 backdrop-blur text-white p-4 rounded-t-2xl">
          <p className="text-sm text-center font-medium">{error}</p>
          {cameraPermissionDenied && (
            <button
              onClick={startCameraManually}
              className="mt-3 w-full bg-white text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              重新请求摄像头权限
            </button>
          )}
        </div>
      )}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur text-indigo-600 px-4 py-2 rounded-full flex items-center gap-2 shadow-lg border border-indigo-100">
        <Camera size={18} />
        <span className="text-sm font-medium">
          {isScanning ? (audioEnabled ? '正在扫描...' : '摄像头已启动，请启用声音') : '正在启动摄像头...'}
        </span>
      </div>

      {/* 音频状态指示器 */}
      {audioStatus === 'playing' && (
        <div className="absolute bottom-4 right-4 bg-green-500/90 backdrop-blur text-white px-3 py-2 rounded-full flex items-center gap-2 shadow-lg">
          <Volume2 size={16} className="animate-pulse" />
          <span className="text-sm font-medium">播放中</span>
        </div>
      )}

      {audioStatus === 'failed' && (
        <div className="absolute bottom-4 right-4 bg-red-500/90 backdrop-blur text-white px-3 py-2 rounded-full flex items-center gap-2 shadow-lg">
          <AlertTriangle size={16} />
          <span className="text-sm font-medium">音频失败</span>
        </div>
      )}
    </div>
  );
}