import { X } from 'lucide-react';

interface ImageViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  imageName?: string;
}

export default function ImageViewerModal({ isOpen, onClose, imageUrl, imageName }: ImageViewerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[100000]">
      <div className="absolute inset-0" onClick={onClose}></div>
      <div className="relative max-w-[95vw] max-h-[95vh]" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <X size={24} />
        </button>
        
        {imageName && (
          <div className="absolute -top-12 left-0 text-white text-sm bg-gray-800 px-3 py-2 rounded-lg">
            {imageName}
          </div>
        )}
        
        <img
          src={imageUrl}
          alt={imageName || 'Imagen'}
          className="max-w-full max-h-[95vh] object-contain rounded-lg shadow-2xl"
        />
      </div>
    </div>
  );
}
