import Image from 'next/image'

export default function Hero() {
  return (
    <section className="relative h-[70vh] md:h-[80vh] w-full">
      <Image
        src="/images/hero.png"
        alt="Piel Canela Coffee"
        fill
        className="object-cover"
        priority
        sizes="100vw"
      />
    </section>
  )
}
