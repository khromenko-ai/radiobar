import React, { useState, useEffect, useRef, useCallback } from 'react';
import { QrCode, X, Camera, RefreshCw, AlertCircle, ArrowRight, Check } from 'lucide-react';
import jsQR from 'jsqr';
import { Language } from '../data/content';
import { motion, AnimatePresence } from 'motion/react';

interface QrScannerProps {
  language: Language;
  onClose: () => void;
}

const scannerLabels: Record<Language, {
  title: string;
  subtitle: string;
  cameraError: string;
  cameraPermissionNeeded: string;
  tryAgain: string;
  manualTitle: string;
  manualPlaceholder: string;
  connect: string;
  orManual: string;
  connecting: string;
  switchCamera: string;
}> = {
  RU: {
    title: 'СКАНЕР QR-КОДА',
    subtitle: 'Наведите камеру на экран хоста для подключения к сессии',
    cameraError: 'Не удалось получить доступ к камере',
    cameraPermissionNeeded: 'Пожалуйста, разрешите доступ к камере в браузере',
    tryAgain: 'Попробовать снова',
    manualTitle: 'Или введите ссылку / ID сессии',
    manualPlaceholder: 'Например: abc123xyz или вставьте ссылку',
    connect: 'ПОДКЛЮЧИТЬСЯ',
    orManual: 'Ввести ссылку вручную',
    connecting: 'Подключение к сессии...',
    switchCamera: 'Сменить камеру',
  },
  EN: {
    title: 'QR CODE SCANNER',
    subtitle: 'Point your camera at the host screen to join the session',
    cameraError: 'Could not access camera',
    cameraPermissionNeeded: 'Please allow camera access in your browser settings',
    tryAgain: 'Try again',
    manualTitle: 'Or enter session link / ID',
    manualPlaceholder: 'e.g. abc123xyz or paste URL',
    connect: 'CONNECT',
    orManual: 'Enter link manually',
    connecting: 'Connecting to session...',
    switchCamera: 'Switch camera',
  },
  ES: {
    title: 'ESCÁNER DE CÓDIGO QR',
    subtitle: 'Apunta tu cámara a la pantalla del anfitrión para unirte',
    cameraError: 'No se pudo acceder a la cámara',
    cameraPermissionNeeded: 'Por favor, permite el acceso a la cámara en el navegador',
    tryAgain: 'Intentar de nuevo',
    manualTitle: 'O introduce el enlace / ID de la sesión',
    manualPlaceholder: 'ej. abc123xyz o pega el enlace',
    connect: 'CONECTAR',
    orManual: 'Introducir enlace manualmente',
    connecting: 'Conectando a la sesión...',
    switchCamera: 'Cambiar cámara',
  },
};

export function navigateToSession(scannedText: string) {
  const trimmed = scannedText.trim();
  if (!trimmed) return;

  try {
    let targetUrl: URL;
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      targetUrl = new URL(trimmed);
    } else if (trimmed.startsWith('/')) {
      targetUrl = new URL(trimmed, window.location.origin);
    } else if (trimmed.includes('session=')) {
      targetUrl = new URL('/' + (trimmed.startsWith('?') ? trimmed : '?' + trimmed), window.location.origin);
    } else {
      // Raw session ID
      targetUrl = new URL(`/?session=${encodeURIComponent(trimmed)}`, window.location.origin);
    }

    // If query params contains session, navigate preserving current host domain
    if (targetUrl.searchParams.has('session') || targetUrl.searchParams.has('scenario')) {
      window.location.href = `${window.location.origin}/?${targetUrl.searchParams.toString()}`;
    } else {
      window.location.href = targetUrl.href;
    }
  } catch {
    // Fallback: navigate as query param or raw url
    if (trimmed.includes('=')) {
      window.location.href = `${window.location.origin}/?${trimmed.replace(/^\?/, '')}`;
    } else {
      window.location.href = `${window.location.origin}/?session=${encodeURIComponent(trimmed)}`;
    }
  }
}

export function QrScannerModal({ language, onClose }: QrScannerProps) {
  const labels = scannerLabels[language] || scannerLabels.RU;
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanLoopRef = useRef<number | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualInputText, setManualInputText] = useState('');

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const stopStream = useCallback(() => {
    if (scanLoopRef.current) {
      cancelAnimationFrame(scanLoopRef.current);
      scanLoopRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      streamRef.current = null;
    }
  }, []);

  const handleDetectedCode = useCallback((codeData: string) => {
    stopStream();
    setScannedResult(codeData);

    // Provide haptic feedback if available
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([50, 50, 100]);
      } catch {}
    }

    // Brief transition to show success before navigation
    setTimeout(() => {
      navigateToSession(codeData);
    }, 700);
  }, [stopStream]);

  const startCamera = useCallback(async () => {
    stopStream();
    setIsLoading(true);
    setError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError(labels.cameraError);
      setIsLoading(false);
      setShowManualInput(true);
      return;
    }

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch (err) {
        // Fallback with basic constraints
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setIsLoading(false);
        startScanLoop();

        // Check for multiple cameras only after stream is active
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
          navigator.mediaDevices.enumerateDevices()
            .then((devices) => {
              const videoDevices = devices.filter(d => d.kind === 'videoinput');
              if (videoDevices.length > 1) {
                setHasMultipleCameras(true);
              }
            })
            .catch(() => {});
        }
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setIsLoading(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError(labels.cameraPermissionNeeded);
      } else {
        setError(labels.cameraError);
      }
      setShowManualInput(true);
    }
  }, [facingMode, labels, stopStream]);

  const startScanLoop = useCallback(() => {
    // Native BarcodeDetector if supported
    let nativeDetector: any = null;
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        nativeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
      } catch {}
    }

    let lastScanTime = 0;

    const scanFrame = async (timestamp: number) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
        scanLoopRef.current = requestAnimationFrame(scanFrame);
        return;
      }

      // Throttle scans to every ~90ms to conserve battery while being responsive
      if (timestamp - lastScanTime > 90) {
        lastScanTime = timestamp;

        try {
          // Attempt native BarcodeDetector first for speed
          if (nativeDetector) {
            try {
              const barcodes = await nativeDetector.detect(video);
              if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                handleDetectedCode(barcodes[0].rawValue);
                return;
              }
            } catch {}
          }

          // Fallback to jsQR
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const qr = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'dontInvert',
            });

            if (qr && qr.data) {
              handleDetectedCode(qr.data);
              return;
            }
          }
        } catch (e) {
          console.warn('QR scan frame error:', e);
        }
      }

      scanLoopRef.current = requestAnimationFrame(scanFrame);
    };

    scanLoopRef.current = requestAnimationFrame(scanFrame);
  }, [handleDetectedCode]);

  useEffect(() => {
    startCamera();
    return () => {
      stopStream();
    };
  }, [startCamera, stopStream]);

  const toggleCameraFacing = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInputText.trim()) {
      handleDetectedCode(manualInputText.trim());
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-4 select-none animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-bg-main border border-border-main rounded-3xl p-6 flex flex-col items-center shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="w-full flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <QrCode size={16} className="text-text-main" />
            <span className="text-[11px] font-sans tracking-[0.2em] text-text-main font-semibold">
              {labels.title}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full border border-border-main hover:border-border-focus text-text-muted hover:text-text-main transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>

        {/* Viewfinder / Video Stage */}
        <div className="relative w-full aspect-square bg-black/90 rounded-2xl overflow-hidden border border-border-main flex items-center justify-center mb-4">
          {/* Hidden Canvas for QR decoding */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Active Video Stream */}
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
            autoPlay
          />

          {/* Loading Indicator */}
          {isLoading && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg-main/80 backdrop-blur-sm z-20">
              <RefreshCw size={24} className="animate-spin text-text-muted mb-2" />
              <span className="text-[10px] tracking-widest text-text-sub uppercase font-mono">
                {language === 'RU' ? 'Запуск камеры...' : 'Starting camera...'}
              </span>
            </div>
          )}

          {/* Camera Error Screen */}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg-main/95 p-5 text-center z-20">
              <AlertCircle size={28} className="text-red-400 mb-2.5" />
              <p className="text-xs font-serif text-text-main mb-1.5">{error}</p>
              <button
                onClick={startCamera}
                className="mt-3 px-3.5 py-1.5 text-[10px] font-mono tracking-widest uppercase border border-border-focus rounded-lg hover:bg-bg-elevated transition-colors text-text-main"
              >
                {labels.tryAgain}
              </button>
            </div>
          )}

          {/* QR Viewfinder Target Overlay */}
          {!isLoading && !error && !scannedResult && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {/* Outer darkened mask around scan area */}
              <div className="relative w-48 h-48 border border-white/20 rounded-2xl">
                {/* Corner Accents */}
                <div className="absolute -top-0.5 -left-0.5 w-4 h-4 border-t-2 border-l-2 border-text-main rounded-tl-sm" />
                <div className="absolute -top-0.5 -right-0.5 w-4 h-4 border-t-2 border-r-2 border-text-main rounded-tr-sm" />
                <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4 border-b-2 border-l-2 border-text-main rounded-bl-sm" />
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 border-b-2 border-r-2 border-text-main rounded-br-sm" />

                {/* Animated Scan Line */}
                <motion.div
                  className="w-full h-0.5 bg-gradient-to-r from-transparent via-text-main to-transparent opacity-75 shadow-[0_0_8px_rgba(255,255,255,0.6)]"
                  animate={{ y: [0, 190, 0] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>
            </div>
          )}

          {/* Success Overlay when QR Code Detected */}
          <AnimatePresence>
            {scannedResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-bg-main/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-30"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center mb-3">
                  <Check size={24} className="text-emerald-400" />
                </div>
                <span className="text-xs font-serif text-text-main mb-1 font-medium">
                  {labels.connecting}
                </span>
                <span className="text-[10px] font-mono tracking-wider text-text-muted truncate max-w-[200px]">
                  {scannedResult}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Switch Camera Button if Multiple Cameras */}
          {hasMultipleCameras && !error && !isLoading && !scannedResult && (
            <button
              onClick={toggleCameraFacing}
              className="absolute bottom-3 right-3 p-2 bg-black/60 hover:bg-black/80 border border-white/20 rounded-full text-white/90 hover:text-white transition-colors cursor-pointer z-10"
              title={labels.switchCamera}
              aria-label={labels.switchCamera}
            >
              <RefreshCw size={14} />
            </button>
          )}
        </div>

        {/* Instructions Subtitle */}
        <p className="text-[11px] font-serif text-text-muted text-center mb-4 leading-relaxed max-w-[280px]">
          {labels.subtitle}
        </p>

        {/* Manual Input Fallback */}
        <div className="w-full pt-3 border-t border-border-main/60">
          {!showManualInput ? (
            <button
              type="button"
              onClick={() => setShowManualInput(true)}
              className="w-full py-1.5 text-[10px] font-sans tracking-[0.15em] text-text-sub hover:text-text-main transition-colors uppercase cursor-pointer text-center"
            >
              {labels.orManual}
            </button>
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-2">
              <div className="text-[9px] font-sans tracking-[0.2em] text-text-sub uppercase">
                {labels.manualTitle}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={manualInputText}
                  onChange={(e) => setManualInputText(e.target.value)}
                  placeholder={labels.manualPlaceholder}
                  className="flex-1 bg-bg-card border border-border-main rounded-xl px-3 py-2 text-xs font-mono text-text-main focus:outline-none focus:border-border-focus"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!manualInputText.trim()}
                  className="px-3 py-2 border border-border-focus rounded-xl text-[10px] font-mono tracking-widest text-text-main hover:bg-bg-inv hover:text-text-inv disabled:opacity-30 transition-colors uppercase flex items-center gap-1 cursor-pointer"
                >
                  <ArrowRight size={13} />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export function QrScannerButton({ language }: { language: Language }) {
  const [isOpen, setIsOpen] = useState(false);

  const titleText = language === 'RU' 
    ? 'Сканировать QR-код хоста' 
    : (language === 'ES' ? 'Escanear código QR' : 'Scan host QR code');

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
        className="flex items-center justify-center text-text-muted hover:text-text-main transition-colors h-5 w-5 select-none cursor-pointer"
        title={titleText}
        aria-label={titleText}
      >
        <QrCode size={15} strokeWidth={1.75} />
      </button>

      {isOpen && (
        <QrScannerModal
          language={language}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
