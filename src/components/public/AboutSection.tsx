import Image from 'next/image'

const COFFEES_IMAGE =
  'https://eobgaersvyjrbvykqqug.supabase.co/storage/v1/object/public/About/coffees.png'

export default function AboutSection() {
  return (
    <section className="bg-white py-6">
      {/*
        Card: content-inset margins, rounded corners, gradient bg, overflow-hidden
        to clip the desktop image that extends past the bottom edge.
      */}
      <div
        className="content-inset-margin relative overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #2B1914 0%, #805438 100%)',
          borderRadius: 'var(--content-radius)',
        }}
      >
        {/*
          Text block.
          Mobile: generous top padding, modest bottom padding before the in-flow image.
          Desktop: pb-[340px] creates the vertical space the absolute image sits in.
        */}
        <div className="relative z-10 flex flex-col items-center text-center px-8 pt-14 pb-8 md:pt-20 md:pb-[340px]">
          <h2
            className="tracking-widest leading-tight mb-5"
            style={{
              fontSize: 'clamp(2rem, 4vw, 3.5rem)',
              // Inline style guarantees TAN Songbird wins over any cascade from
              // globals.css h2 base rule (unlayered CSS beats @layer utilities).
              // Falls back to Georgia if /public/fonts/TAN-Songbird.woff2 is missing.
              fontFamily: "'TAN Songbird', Georgia, serif",
              fontWeight: 700,
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

        {/*
          Mobile image: in normal flow so the card expands to fit it.
          object-contain so the full image is visible; object-bottom anchors
          the cups to the card bottom edge with nothing cut off.
        */}
        <div className="relative w-full md:hidden" style={{ height: '300px' }}>
          <Image
            src={COFFEES_IMAGE}
            alt="Piel Canela coffees"
            fill
            className="object-contain object-bottom"
            sizes="100vw"
          />
        </div>

        {/*
          Desktop image: absolutely positioned, full card width.
          bottom: -30px → extends 30px past the card's bottom edge.
          overflow-hidden on the card clips that 30px, hiding the cup bases
          and creating the "cups rising from the bottom" effect.
          object-cover + object-top fills the full width and anchors to the
          top of the image (cup toppings visible, bases clipped).
        */}
        <div
          className="hidden md:block absolute left-0 right-0"
          style={{ bottom: '-30px', height: '320px' }}
        >
          <Image
            src={COFFEES_IMAGE}
            alt="Piel Canela coffees"
            fill
            className="object-cover object-top"
            sizes="100vw"
          />
        </div>
      </div>
    </section>
  )
}
