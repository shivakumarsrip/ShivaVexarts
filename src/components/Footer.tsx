export default function Footer() {
  const scrollTo = (id: string) => {
    const el = document.querySelector(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <footer className="bg-[#09090B] border-t border-[#27272A]">
      <div className="container-vex py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-body text-[13px] text-[#52525B]">
            VEXARTS DIGITAL 2025
          </p>

          <div className="flex items-center gap-4">
            <button
              onClick={() => scrollTo("#gallery")}
              className="font-body text-[13px] text-[#A1A1AA] hover:text-white transition-colors"
            >
              Shop Artworks
            </button>
            <span className="text-[#52525B]">|</span>
            <button
              onClick={() => scrollTo("#about")}
              className="font-body text-[13px] text-[#A1A1AA] hover:text-white transition-colors"
            >
              About
            </button>
            <span className="text-[#52525B]">|</span>
            <button
              onClick={() => scrollTo("#contact")}
              className="font-body text-[13px] text-[#A1A1AA] hover:text-white transition-colors"
            >
              Contact
            </button>
          </div>

          <p className="font-body text-[13px] text-[#52525B]">
            Digital Canvas by Shivakumar S
          </p>
        </div>
      </div>
    </footer>
  );
}
