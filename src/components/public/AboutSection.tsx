const COFFEES_IMAGE =
  'https://eobgaersvyjrbvykqqug.supabase.co/storage/v1/object/public/About/coffees.png'

export default function AboutSection() {
  return (
    <section className="bg-white py-6">
      <div
        className="content-inset-margin relative overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #2B1914 0%, #805438 100%)',
          borderRadius: 'var(--content-radius)',
        }}
      >
        <div className="relative z-10 flex flex-col items-center text-center px-8 pt-14 pb-8 md:pt-20 md:pb-[340px]">
          <h2
            className="font-heading tracking-widest leading-tight mb-5"
            style={{
              fontSize: 'clamp(2rem, 4vw, 3.5rem)',
              color: 'white',
            }}
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

        {/* Mobile: plain <img> bypasses Next.js image optimization proxy, avoiding Supabase 402 */}
        <div className="relative w-full md:hidden" style={{ height: '300px' }}>
          <img
            src={COFFEES_IMAGE}
            alt="Piel Canela drinks"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              objectPosition: 'center bottom',
            }}
          />
        </div>

        {/* Desktop: plain <img>, anchored to bottom, extends 30px past card so overflow-hidden clips cup bases */}
        <div
          className="hidden md:block absolute left-0 right-0"
          style={{ bottom: '-30px', height: '400px' }}
        >
          <img
            src={COFFEES_IMAGE}
            alt="Piel Canela drinks"
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
