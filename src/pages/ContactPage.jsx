import { MapPin, MessageCircle, Phone } from "lucide-react";

export default function ContactPage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
      <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-10">
        <p className="text-sm font-bold tracking-[0.16em] text-[var(--accent)]">GET IN TOUCH</p>
        <h1 className="mt-3 text-3xl font-bold text-[var(--brand)]">Contact Golden Loom Myanmar</h1>
        <p className="mt-3 text-[var(--text-muted)]">Need help with an order or pickup? Get in touch with us on WhatsApp.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <section className="rounded-2xl border border-[var(--border)] p-5">
            <h2 className="flex items-center gap-2 text-lg font-bold text-[var(--brand)]"><MapPin size={20} /> Pickup location</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">Open the map for the pickup location in Dubai. Pickup is available from 9:00 AM to 3:00 PM.</p>
            <a className="mt-4 inline-flex font-semibold text-[var(--brand)] underline" href="https://maps.google.com/maps?q=25.264416,55.316384&amp;ll=25.264416,55.316384&amp;z=16" target="_blank" rel="noopener noreferrer">View pickup location on Google Maps</a>
          </section>
          <section className="rounded-2xl border border-[var(--border)] p-5">
            <h2 className="flex items-center gap-2 text-lg font-bold text-[var(--brand)]"><MessageCircle size={20} /> Customer help</h2>
            <p className="mt-3 text-sm text-[var(--text-muted)]">Questions about your order, pickup, or products? Send us a message.</p>
            <a className="mt-4 inline-flex rounded-xl bg-[var(--brand)] px-4 py-3 font-semibold text-white" href="https://wa.me/971502560924" target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a>
            <a className="mt-4 flex items-center gap-2 text-sm font-semibold text-[var(--brand)]" href="tel:+971502560924"><Phone size={16} /> +971 50 256 0924</a>
          </section>
        </div>
      </section>
    </main>
  );
}
