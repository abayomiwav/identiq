import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a0a',
        }}
      >
        <svg width="24" height="24" viewBox="0 0 48 48" fill="none">
          <line x1="24" y1="11" x2="11" y2="35" stroke="#818cf8" strokeWidth="4" strokeLinecap="round" />
          <line x1="24" y1="11" x2="37" y2="35" stroke="#818cf8" strokeWidth="4" strokeLinecap="round" />
          <circle cx="11" cy="35" r="6" fill="#0a0a0a" stroke="#818cf8" strokeWidth="3" />
          <circle cx="37" cy="35" r="6" fill="#0a0a0a" stroke="#818cf8" strokeWidth="3" />
          <circle cx="24" cy="11" r="8.5" fill="#818cf8" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
