'use client'

import { useState } from 'react'

const COFFEES_IMAGE =
  'https://eobgaersvyjrbvykqqug.supabase.co/storage/v1/object/public/About/Coffees.webp'
const COFFEES_FALLBACK =
  'https://eobgaersvyjrbvykqqug.supabase.co/storage/v1/object/public/About/coffees.png'

export default function AboutSection() {
  const [imgSrc, setImgSrc] = useState(COFFEES_IMAGE)

  return (
    <section className="bg-white py-6">
      <div
        className="content-inset-margin relative overflow-hidden min-h-[520px] md:min-h-0"
        style={{
          background: 'linear-gradient(180deg, #2B1914 0%, #805438 100%)',
          borderRadius: 'var(--content-radius)',
        }}
      >
        <div className="relative z-10 flex flex-col items-center text-center px-8 pt-14 pb-[300px] md:pt-20 md:pb-[340px]">
          <h2
            className="font-heading text-2xl md:text-4xl tracking-widest leading-tight mb-5 whitespace-nowrap"
            style={{ color: 'white' }}
          >
            PIEL CANELA
          </h2>

          <p
            className="font-menu text-white/90 leading-relaxed mb-8 max-w-[290px] md:max-w-[400px]"
            style={{ fontSize: '14px', fontWeight: 400 }}
          >
            Un pedacito de México in every sip. Handcrafted with love, inspired by our roots.
          </p>

          <a
            href="#menu"
            className="inline-block border border-white text-white font-nav text-[11px] font-bold tracking-[0.14em] uppercase px-7 py-3 rounded-full hover:bg-white hover:text-[#805438] transition-colors duration-200"
          >
            ORDER ONLINE
          </a>
        </div>

        {/* Mobile: absolute, anchored to bottom, wider than card so sides bleed and overflow-hidden clips */}
        <img
          className="md:hidden absolute"
          src={imgSrc}
          alt="Piel Canela drinks"
          onError={() => setImgSrc(COFFEES_FALLBACK)}
          style={{
            width: '100%',
            height: 'auto',
            left: '50%',
            bottom: 0,
            transform: 'translateX(-50%)',
          }}
        />

        {/* Desktop: plain <img>, anchored to bottom, extends 30px past card so overflow-hidden clips cup bases */}
        <div
          className="hidden md:block absolute left-0 right-0"
          style={{ bottom: '-30px', height: '480px' }}
        >
          <img
            src={imgSrc}
            alt="Piel Canela drinks"
            onError={() => setImgSrc(COFFEES_FALLBACK)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center top',
            }}
          />
        </div>
      </div>
    </section>
  )
}
