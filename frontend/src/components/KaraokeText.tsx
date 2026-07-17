interface KaraokeTextProps {
  text: string;
  activeWordIndex: number;
}

export function KaraokeText({ text, activeWordIndex }: KaraokeTextProps) {
  const tokens = text.split(/(\s+)/);
  let wordIndex = -1;

  return (
    <p className="m-0 text-[22px] leading-[1.6] text-bb-ink sm:text-[24px]">
      {tokens.map((token, tokenIndex) => {
        if (/^\s+$/.test(token)) {
          return token;
        }

        wordIndex += 1;
        const isActive = wordIndex === activeWordIndex;

        return (
          <span
            className={isActive ? 'rounded-md bg-bb-highlight px-0.5' : undefined}
            key={`${token}-${tokenIndex}`}
          >
            {token}
          </span>
        );
      })}
    </p>
  );
}
