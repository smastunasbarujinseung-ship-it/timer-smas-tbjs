import React, { useState } from 'react';

interface SchoolCrestProps {
  size?: number;
  className?: string;
  withRing?: boolean;
}

export const SchoolCrest: React.FC<SchoolCrestProps> = ({
  size = 56,
  className = '',
  withRing = false,
}) => {
  const [imageError, setImageError] = useState(false);

  if (imageError) {
    // Fallback if image fails to load
    return (
      <div
        className={`flex items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 border-2 border-[#D4AF37] text-amber-900 font-black text-sm shadow-sm ${className}`}
        style={{ width: size, height: size }}
      >
        TBJS
      </div>
    );
  }

  const imageElement = (
    <img
      src="/assets/logo_smas_tunas_baru_jin_seung_web.png"
      alt="Logo Resmi SMAS Tunas Baru Jin Seung"
      width={size}
      height={size}
      onError={() => setImageError(true)}
      className={`object-contain drop-shadow-md filter select-none transition-transform hover:scale-105 duration-200 ${className}`}
      style={{
        width: size,
        height: size,
      }}
    />
  );

  if (withRing) {
    return (
      <div
        className="p-1.5 rounded-2xl bg-white/90 border-2 border-[#D4AF37] shadow-md flex items-center justify-center shrink-0"
        style={{ width: size + 14, height: size + 14 }}
      >
        {imageElement}
      </div>
    );
  }

  return imageElement;
};
