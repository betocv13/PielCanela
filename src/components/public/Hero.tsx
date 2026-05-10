import Image from 'next/image'

export default function Hero() {
  return (
    // announcement bar (h-9 = 36px) + mobile header (h-16 = 64px) = 100px
    // announcement bar (h-9 = 36px) + desktop header (h-20 = 80px) = 116px
    <section className="bg-white pt-[100px] md:pt-[116px] px-6 md:px-8 pb-8">
      <div className="relative rounded-[20px] md:rounded-[24px] overflow-hidden h-[72vh] md:h-[78vh]">
        {/* Mobile image */}
        <Image
          src="/images/Mobile.png"
          alt="Piel Canela Coffee"
          fill
          className="object-cover md:hidden"
          priority
          sizes="(max-width: 767px) 100vw, 0px"
        />
        {/* Desktop image */}
        <Image
          src="/images/BannerPink.png"
          alt="Piel Canela Coffee"
          fill
          className="object-cover hidden md:block"
          priority
          sizes="(min-width: 768px) 100vw, 0px"
        />

        {/* Bottom-right overlay: text + CTA */}
        <div className="absolute bottom-7 right-6 md:bottom-10 md:right-10 text-right">
          <p className="text-white text-[10px] md:text-[11px] font-bold tracking-[0.22em] uppercase mb-2 drop-shadow">
            Bienvenidos
          </p>
          <h1 className="text-white text-3xl md:text-5xl font-heading leading-tight mb-4 drop-shadow-lg">
            Un Toque Mexicano
          </h1>
          <a
            href="#menu"
            className="inline-block border border-white text-white font-nav text-[11px] font-bold tracking-[0.14em] uppercase px-7 py-3 rounded-full hover:bg-white hover:text-brand-brown transition-colors duration-200"
          >
            Order Now
          </a>
        </div>
      </div>
    </section>
  )
}
