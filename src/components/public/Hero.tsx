import Image from 'next/image'

export default function Hero() {
  return (
    <section className="relative h-[70vh] md:h-[80vh] w-full">
      {/* Mobile image */}
      <Image
        src="/images/Mobile.png"
        alt="Piel Canela Coffee"
        fill
        className="object-cover md:hidden"
        priority
        sizes="100vw"
      />
      {/* Desktop image */}
      <Image
        src="/images/BannerPink.png"
        alt="Piel Canela Coffee"
        fill
        className="object-cover hidden md:block"
        priority
        sizes="100vw"
      />
    </section>
  )
}
