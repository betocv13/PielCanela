import Image from 'next/image'

export default function Hero() {
  return (
    <section className="relative h-[70vh] md:h-[80vh] w-full">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/images/hero.jpg"
          alt="Piel Canela Coffee"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Content */}
      <div className="relative h-full flex items-center justify-center">
        <div className="text-center px-4">
          {/* Main heading */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading text-white tracking-wider">
              ORDER
            </h1>
            <div className="hidden md:block w-32 lg:w-48" /> {/* Spacer for cup */}
            <div className="text-right">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading text-white tracking-wider">
                COFFEE
              </h1>
              <p className="text-xl md:text-2xl text-white/90 italic font-light mt-1">
                Welcome
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex items-start justify-center p-2">
          <div className="w-1 h-2 bg-white/50 rounded-full" />
        </div>
      </div>
    </section>
  )
}
