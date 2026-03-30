const DEFAULT_BG =
  "https://d118zx96cghsvi.cloudfront.net/uploads/1755475636416-subscribebg.webp";

export function CategoryHero({ backgroundImage = DEFAULT_BG, title }: { backgroundImage?: string; title: string }) {
  return (
    <div
      className="relative flex h-[120px] w-full items-center justify-center overflow-hidden rounded-[10px] bg-cover bg-center bg-no-repeat md:h-[240px] md:rounded-[20px]"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-10 px-4 text-center text-white">
        <h1 className="m-0 break-words text-3xl font-semibold leading-tight tracking-wider md:text-4xl md:tracking-widest lg:text-6xl">
          {title}
        </h1>
      </div>
    </div>
  );
}
