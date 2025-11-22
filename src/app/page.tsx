export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="text-center max-w-2xl">
        {/* Logo placeholder */}
        <div className="w-32 h-32 mx-auto mb-8 bg-brand-brown rounded-full flex items-center justify-center">
          <span className="text-4xl">☕</span>
        </div>

        {/* Heading */}
        <h1 className="text-4xl md:text-5xl font-heading text-brand-brown mb-4">
          Piel Canela
        </h1>

        {/* Tagline */}
        <p className="text-xl text-gray-600 mb-8">
          A taste that feels like home
        </p>

        {/* Brand message */}
        <p className="text-gray-500 mb-8 italic">
          &ldquo;Piel Canela isn&apos;t just a drink, it&apos;s a reminder of where we come from&rdquo;
        </p>

        {/* Status message */}
        <div className="card max-w-md mx-auto">
          <h2 className="text-lg font-semibold text-brand-brown mb-2">
            Coming Soon
          </h2>
          <p className="text-gray-600 text-sm">
            We&apos;re setting up our online ordering system. Check back soon to order your favorite coffee and matcha drinks!
          </p>
        </div>

        {/* Color palette preview */}
        <div className="mt-12">
          <p className="text-sm text-gray-500 mb-3">Brand Colors</p>
          <div className="flex gap-2 justify-center">
            <div className="w-8 h-8 rounded bg-brand-brown" title="Primary Brown"></div>
            <div className="w-8 h-8 rounded bg-brand-cream border" title="Cream"></div>
            <div className="w-8 h-8 rounded bg-brand-pink" title="Pink"></div>
            <div className="w-8 h-8 rounded bg-brand-green" title="Green"></div>
            <div className="w-8 h-8 rounded bg-brand-beige border" title="Beige"></div>
          </div>
        </div>
      </div>
    </main>
  );
}
