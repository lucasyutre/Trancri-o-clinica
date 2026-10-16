import React, { useEffect, useRef } from 'react';

interface AudioWaveformProps {
  analyserNode: AnalyserNode | null;
  isActive: boolean;
  isPaused?: boolean;
  className?: string;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  analyserNode,
  isActive,
  isPaused = false,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let bufferLength = 64;
    let dataArray = new Uint8Array(bufferLength);

    if (analyserNode) {
      analyserNode.fftSize = 128;
      bufferLength = analyserNode.frequencyBinCount;
      dataArray = new Uint8Array(bufferLength);
    }

    const render = () => {
      animationFrameRef.current = requestAnimationFrame(render);

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const centerY = height / 2;

      if (!isActive) {
        // Flat resting line
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.stroke();
        return;
      }

      if (isPaused) {
        // Dashed amber line when paused
        ctx.beginPath();
        ctx.setLineDash([6, 6]);
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.setLineDash([]);
        return;
      }

      if (analyserNode) {
        analyserNode.getByteTimeDomainData(dataArray);
      }

      // Draw glowing clinical waveform
      ctx.beginPath();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#0284c7'; // sky-600

      const sliceWidth = width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        // v ranges from 0 to 255, center is 128
        const v = dataArray[i] / 128.0;
        const y = v * centerY;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(width, centerY);
      ctx.stroke();

      // Draw secondary softer glow fill under the curve
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, 'rgba(14, 165, 233, 0.15)');
      gradient.addColorStop(1, 'rgba(14, 165, 233, 0.0)');
      ctx.fillStyle = gradient;
      ctx.fill();
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [analyserNode, isActive, isPaused]);

  return (
    <div className={`relative overflow-hidden rounded-xl bg-slate-900/5 ${className}`}>
      <canvas
        ref={canvasRef}
        width={320}
        height={60}
        className="w-full h-full block"
      />
      {isActive && !isPaused && (
        <span className="absolute top-1.5 right-2 flex items-center gap-1.5 text-[9px] font-bold text-sky-700 bg-sky-100/90 px-2 py-0.5 rounded-full border border-sky-200">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-ping"></span>
          ÁUDIO AO VIVO
        </span>
      )}
      {isPaused && (
        <span className="absolute top-1.5 right-2 flex items-center gap-1.5 text-[9px] font-bold text-amber-700 bg-amber-100/90 px-2 py-0.5 rounded-full border border-amber-200">
          PAUSADO
        </span>
      )}
    </div>
  );
};
