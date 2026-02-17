const Footer = () => {
    return (
        <footer className="w-full py-8 mt-auto border-t border-slate-200 dark:border-slate-800">
  <div className="flex flex-col items-center justify-center space-y-2 text-center">
    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
      Data Source: 
      <a 
        href="https://quranapi.pages.dev" 
        target="_blank" 
        rel="noopener noreferrer"
        className="ml-1 text-emerald-600 hover:text-emerald-500 hover:underline transition-all"
      >
        QuranAPI.pages.dev
      </a>
    </p>
    <div className="flex items-center space-x-1 text-xs text-slate-400">
      <span>Developed with</span>
      <span className="text-red-500 animate-pulse">❤️</span>
      <span>for the Ummah.</span>
    </div>
  </div>
</footer>
    )
}
export default Footer