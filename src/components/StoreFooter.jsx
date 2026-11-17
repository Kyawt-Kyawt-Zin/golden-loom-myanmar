export default function StoreFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-center text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p className="font-medium text-[var(--brand)]">
          Myanmar-made sweaters · Dubai delivery
        </p>

        <p className="text-[var(--text-muted)]">
          © {currentYear} Golden Loom Myanmar. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
