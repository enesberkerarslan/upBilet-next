import Link from "next/link";

export type HeroProps = {
  backgroundImageUrl?: string;
  homeTeamName?: string;
  awayTeamName?: string;
  dateTime?: string;
  time?: string;
  venue?: string;
  description?: string;
  /** Tam URL veya uygulama yolu (örn. /odeme veya /en/odeme) */
  ticketHref: string;
  /** İki takım adı da yoksa yan sütunlar gösterilmez (F1 vb. görseller için) */
  showTeamColumns?: boolean;
};

export function MainSlider({
  backgroundImageUrl = "/event.png",
  homeTeamName,
  awayTeamName,
  dateTime = "",
  time = "",
  venue = "",
  description = "",
  ticketHref,
  showTeamColumns = true,
}: HeroProps) {
  const href = ticketHref;
  return (
    <div className="relative h-[450px] w-full overflow-hidden rounded-2xl text-white md:h-[500px]">
      <div className="absolute inset-0 z-1">
        <img
          src={backgroundImageUrl}
          alt="Anasayfa Slider"
          className="h-full w-full object-cover"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-linear-to-b from-black/30 to-black/50" />
      </div>

      <div className="relative z-2 flex h-full flex-col items-center justify-start p-2 pt-0 text-center md:justify-center md:p-8 md:pt-0">
        {showTeamColumns ? (
          <div className="flex w-full flex-col items-center justify-evenly gap-1 md:flex-row md:gap-0">
            <div className="flex h-[100px] w-[100px] items-center justify-center md:h-[200px] md:w-[200px]">
              <span className="text-center text-4xl font-bold md:text-7xl">{homeTeamName}</span>
            </div>

            <div className="flex flex-col">
              <div className="text-2xl uppercase md:text-3xl">{dateTime}</div>
              <div className="my-0 text-4xl font-bold md:my-1 md:text-6xl">{time}</div>
              <div className="text-lg opacity-90 md:text-base">{venue}</div>
            </div>

            <div className="flex h-[100px] w-[100px] items-center justify-center md:h-[200px] md:w-[200px]">
              <span className="text-center text-4xl font-bold md:text-7xl">{awayTeamName}</span>
            </div>
          </div>
        ) : (
          <div className="flex w-full flex-col items-center justify-center gap-2 px-4">
            {dateTime ? <div className="text-2xl uppercase md:text-3xl">{dateTime}</div> : null}
            {time ? <div className="text-4xl font-bold md:text-6xl">{time}</div> : null}
            {venue ? <div className="text-lg opacity-90 md:text-base">{venue}</div> : null}
          </div>
        )}

        <div className="flex flex-col items-center md:mt-4">
          <Link
            href={href}
            className="inline-block cursor-pointer rounded-full border-none bg-[#4c6fff] px-8 py-3 text-base font-bold text-white no-underline transition-colors hover:bg-[#3857e0]"
          >
            Bilet Al
          </Link>
          <div className="mt-3 max-w-[90vw] text-center text-xs opacity-80 md:absolute md:bottom-3 md:left-0 md:mt-0 md:w-full md:text-sm">
            {description}
          </div>
        </div>
      </div>
    </div>
  );
}
