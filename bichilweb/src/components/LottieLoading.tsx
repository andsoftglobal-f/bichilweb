'use client';

import Lottie from 'lottie-react';
import animationData from '../../public/loading-bichilweb.json';

interface LottieLoadingProps {
  size?: number;
  fullScreen?: boolean;
  className?: string;
}

export default function LottieLoading({ size = 120, fullScreen = false, className = '' }: LottieLoadingProps) {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        <Lottie animationData={animationData} loop style={{ width: size, height: size }} />
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Lottie animationData={animationData} loop style={{ width: size, height: size }} />
    </div>
  );
}
