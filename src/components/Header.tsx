export default function Header() {
  return (
    <header className="border-b border-mck-gray-200 bg-mck-navy px-6 py-4 text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Performance Dashboard</h1>
          <p className="text-sm text-mck-gray-400">Weekly balanced scorecard across boats, trades, supervisors, and crews</p>
        </div>
        <div className="hidden h-8 w-1 rounded-full bg-mck-blue sm:block" aria-hidden />
      </div>
    </header>
  );
}
