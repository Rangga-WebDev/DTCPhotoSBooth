/** @format */

// Ikon garis sederhana (24 × 24), warna mengikuti teks.
const PATHS = {
  arrow: "M4 12h15M13 6l6 6-6 6",
  back: "M20 12H5M11 6l-6 6 6 6",
  download: "M12 3v12M7 10l5 5 5-5M4 20h16",
  print: "M7 9V3h10v6M7 17H4V9h16v8h-3M7 14h10v7H7z",
  share: "M12 15V3M7 8l5-5 5 5M5 13v8h14v-8",
  external: "M14 4h6v6M20 4l-9 9M18 14v6H4V6h6",
  copy: "M9 9h11v11H9zM5 15H4V4h11v1",
  refresh:
    "M20 6v5h-5M4 18v-5h5M18.5 9A7 7 0 0 0 6 7.5L4 10M5.5 15A7 7 0 0 0 18 16.5l2-2.5",
  sound: "M4 9v6h4l5 4V5L8 9H4zM16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11",
  expand: "M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5",
};

export default function Icon({ name, className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATHS[name] ?? PATHS.arrow} />
    </svg>
  );
}
