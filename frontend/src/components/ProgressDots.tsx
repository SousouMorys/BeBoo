interface ProgressDotsProps {
  activeIndex: number;
  total: number;
}

export function ProgressDots({ activeIndex, total }: ProgressDotsProps) {
  return (
    <div aria-label={`Page ${activeIndex + 1} of ${total}`} className="flex items-center justify-center gap-2" role="img">
      {Array.from({ length: total }, (_, index) => (
        <span
          aria-hidden="true"
          className={`h-2.5 rounded-full ${index === activeIndex ? 'w-6 bg-bb-teal-deep' : 'w-2.5 bg-bb-sand'}`}
          key={index}
        />
      ))}
    </div>
  );
}
