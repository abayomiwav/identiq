import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fafaf9',
          fontFamily: 'sans-serif',
          border: '16px solid #0a0a0a',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 20,
            letterSpacing: 4,
            textTransform: 'uppercase',
            color: '#2f3ee0',
            marginBottom: 28,
          }}
        >
          Decentralized identity infrastructure
        </div>
        <svg width="100" height="100" viewBox="0 0 48 48" fill="none" style={{ marginBottom: 28 }}>
          <line x1="24" y1="11" x2="11" y2="35" stroke="#2f3ee0" strokeWidth="3" strokeLinecap="round" />
          <line x1="24" y1="11" x2="37" y2="35" stroke="#2f3ee0" strokeWidth="3" strokeLinecap="round" />
          <circle cx="11" cy="35" r="5.5" fill="#fafaf9" stroke="#2f3ee0" strokeWidth="2.5" />
          <circle cx="37" cy="35" r="5.5" fill="#fafaf9" stroke="#2f3ee0" strokeWidth="2.5" />
          <circle cx="24" cy="11" r="7.5" fill="#2f3ee0" />
        </svg>
        <div style={{ display: 'flex', fontSize: 80, fontWeight: 700, color: '#0a0a0a', letterSpacing: -2 }}>
          Identiq
        </div>
        <div style={{ display: 'flex', fontSize: 30, color: '#6b7280', marginTop: 16 }}>
          Verify Once. Access Everywhere.
        </div>
      </div>
    ),
    { ...size },
  );
}
