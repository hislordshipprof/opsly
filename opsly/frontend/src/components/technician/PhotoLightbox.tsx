import type { VisionAssessment } from '@/types';

interface PhotoLightboxProps {
  photoUrl: string | null;
  assessment?: VisionAssessment | null;
  onClose: () => void;
}

export function PhotoLightbox({ photoUrl, assessment, onClose }: PhotoLightboxProps) {
  if (!photoUrl) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-6 right-6 size-10 rounded-full bg-white/10 flex items-center justify-center text-white text-xl hover:bg-white/20 transition-colors"
        aria-label="Close lightbox"
      >
        &times;
      </button>

      {/* Photo with fallback placeholder */}
      <div
        className="relative max-w-[80vw] max-h-[80vh] min-w-[300px] min-h-[200px] rounded-xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center">
          <span className="text-white/40 text-sm">Tenant uploaded photo</span>
        </div>
        <img
          src={photoUrl}
          alt="Tenant uploaded photo"
          className="relative w-full h-full object-contain"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      </div>

      {assessment && (
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/70 text-white px-6 py-3 rounded-xl text-sm max-w-[500px] text-center backdrop-blur-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <strong>AI Assessment:</strong>{' '}
          {assessment.damageType?.replace(/_/g, ' ')}, {assessment.severity} severity
          {' '}({Math.round((assessment.confidence ?? 0) * 100)}% confidence).
          {assessment.description ? ` ${assessment.description}` : ''}
        </div>
      )}
    </div>
  );
}
