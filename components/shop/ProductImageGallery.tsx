'use client'

import { useState } from 'react'

interface Props {
  images: string[]
  name: string
}

export function ProductImageGallery({ images, name }: Props) {
  const [active, setActive] = useState(0)

  return (
    <div>
      <div className="aspect-square bg-gray-50 border border-gray-100 overflow-hidden mb-3">
        {images[active] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={images[active]}
            alt={name}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <span className="text-xs">No image</span>
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.slice(0, 8).map((img, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={img}
              alt={`${name} ${i + 1}`}
              onClick={() => setActive(i)}
              className={`w-full aspect-square object-contain bg-gray-50 border cursor-pointer transition-colors duration-200 ${
                active === i ? 'border-[#d4006e]' : 'border-gray-100 hover:border-gray-300'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
