import Image from 'next/image'

export default function Hero() {
  return (
    <section className="relative h-[100vh] md:h-[100vh] w-full">
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
    </section>
  )
}
