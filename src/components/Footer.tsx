const Footer = () => {
    return (
        <footer className="w-full py-8 mt-auto border-t border-border" role="contentinfo">
  <div className="flex flex-col items-center justify-center space-y-2 text-center">
    <p className="text-sm font-medium text-muted-foreground">
      Data Source: 
      <a 
        href="https://quranapi.pages.dev" 
        target="_blank" 
        rel="noopener noreferrer"
        className="ml-1 text-primary hover:text-primary/80 hover:underline transition-all"
      >
        QuranAPI.pages.dev
      </a>
    </p>
    <div className="flex items-center space-x-1 text-xs text-muted-foreground">
      <span>Developed with</span>
      <span className="text-red-500 animate-pulse" aria-label="love">❤️</span>
      <span>for the Ummah.</span>
    </div>
  </div>
</footer>
    )
}
export default Footer