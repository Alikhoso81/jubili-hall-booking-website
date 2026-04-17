import { useState } from 'react';
import { X } from 'lucide-react';
import { Crown } from 'lucide-react';

const images = [
  {
    url: 'https://images.pexels.com/photos/1045541/pexels-photo-1045541.jpeg?auto=compress&cs=tinysrgb&w=800',
    label: 'Grand Hall Setup',
  },
  {
    url: 'https://images.pexels.com/photos/2306281/pexels-photo-2306281.jpeg?auto=compress&cs=tinysrgb&w=800',
    label: 'Wedding Reception',
  },
  {
    url: 'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=800',
    label: 'Evening Celebration',
  },
  {
    url: 'https://images.pexels.com/photos/169193/pexels-photo-169193.jpeg?auto=compress&cs=tinysrgb&w=800',
    label: 'Stage & Lighting',
  },
  {
    url: 'https://images.pexels.com/photos/587741/pexels-photo-587741.jpeg?auto=compress&cs=tinysrgb&w=800',
    label: 'Elegant Table Setting',
  },
  {
    url: 'https://images.pexels.com/photos/1729799/pexels-photo-1729799.jpeg?auto=compress&cs=tinysrgb&w=800',
    label: 'Floral Decoration',
  },
  {
    url: 'https://images.pexels.com/photos/2291367/pexels-photo-2291367.jpeg?auto=compress&cs=tinysrgb&w=800',
    label: 'Banquet Hall',
  },
  {
    url: 'https://images.pexels.com/photos/3171837/pexels-photo-3171837.jpeg?auto=compress&cs=tinysrgb&w=800',
    label: 'Corporate Event',
  },
  {
    url: 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=800',
    label: 'Bridal Ceremony',
  },
];

export default function GalleryPage() {
  const [lightbox, setLightbox] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#f7f5f0]">
      <section className="relative pt-32 pb-20 bg-[#0d1b0f]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Crown className="w-12 h-12 text-[#C9A84C] mx-auto mb-4" />
          <h1 className="text-5xl font-bold text-white mb-4">Gallery</h1>
          <p className="text-white/60 text-lg">A glimpse into the world of Jublii Group.</p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-[#C9A84C] text-sm tracking-[0.3em] font-medium uppercase mb-3">Our Moments</p>
            <h2 className="text-4xl font-bold text-[#0d1b0f]">Captured Memories</h2>
          </div>

          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
            {images.map(({ url, label }, idx) => (
              <button
                key={idx}
                onClick={() => setLightbox(url)}
                className="break-inside-avoid w-full group relative overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all duration-300"
              >
                <img
                  src={url}
                  alt={label}
                  className="w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d1b0f]/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <span className="text-white font-medium text-sm">{label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2"
            onClick={() => setLightbox(null)}
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={lightbox}
            alt="Gallery"
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
