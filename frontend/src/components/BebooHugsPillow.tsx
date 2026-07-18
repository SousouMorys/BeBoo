import { EmotionFace } from './EmotionFace';

/** A calm, in-app illustration made entirely from circles and soft ellipses. */
export function BebooHugsPillow() {
  return (
    <div
      aria-label="BeBoo hugging a soft pillow"
      className="relative mx-auto aspect-[300/230] w-full max-w-[320px]"
      role="img"
    >
      <svg aria-hidden="true" className="absolute inset-0 h-full w-full" viewBox="0 0 300 230">
        <ellipse cx="150" cy="206" fill="var(--bb-sand)" opacity="0.56" rx="108" ry="14" />
        <ellipse cx="192" cy="143" fill="var(--bb-coral)" rx="70" ry="58" />
        <ellipse cx="192" cy="143" fill="var(--bb-highlight)" opacity="0.44" rx="52" ry="43" />
        <ellipse cx="106" cy="126" fill="var(--bb-teal)" rx="73" ry="59" />
        <circle cx="63" cy="100" fill="var(--bb-teal)" r="28" />
        <circle cx="94" cy="71" fill="var(--bb-teal)" r="35" />
        <circle cx="137" cy="74" fill="var(--bb-teal)" r="31" />
        <circle cx="165" cy="105" fill="var(--bb-teal)" r="28" />
        <ellipse cx="133" cy="151" fill="var(--bb-teal)" rx="17" ry="39" transform="rotate(-42 133 151)" />
        <ellipse cx="167" cy="164" fill="var(--bb-teal)" rx="16" ry="41" transform="rotate(42 167 164)" />
        <ellipse cx="151" cy="172" fill="var(--bb-teal-deep)" opacity="0.13" rx="13" ry="7" />
        <ellipse cx="220" cy="172" fill="var(--bb-coral)" opacity="0.3" rx="18" ry="9" />
      </svg>
      <EmotionFace className="absolute left-[20%] top-[28%] h-auto w-[34%]" emotion="calm" size={104} />
    </div>
  );
}
