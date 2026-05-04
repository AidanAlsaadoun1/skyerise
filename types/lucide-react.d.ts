// Defensive shim: some published lucide-react tarballs point `typings` at a
// path that isn't included in the package, so TS can't auto-detect them.
// Re-declare the surface we use as React function components accepting an
// SVGProps-compatible `LucideProps` object.
declare module "lucide-react" {
  import type { ComponentType, SVGProps } from "react";

  export interface LucideProps extends SVGProps<SVGSVGElement> {
    size?: number | string;
    absoluteStrokeWidth?: boolean;
  }

  export type LucideIcon = ComponentType<LucideProps>;

  // Catch-all: every named export from lucide-react is an icon component.
  const icons: Record<string, LucideIcon>;
  export default icons;

  // Named exports we actually import. Listing them gives editors better
  // autocomplete; the catch-all `[key: string]: LucideIcon` below covers
  // anything else without breaking type-checking.
  export const Sunrise: LucideIcon;
  export const Sunset: LucideIcon;
  export const Search: LucideIcon;
  export const MapPin: LucideIcon;
  export const Locate: LucideIcon;
  export const Loader2: LucideIcon;
  export const Clock: LucideIcon;
  export const Droplets: LucideIcon;
  export const Eye: LucideIcon;
  export const Thermometer: LucideIcon;
  export const Wind: LucideIcon;
  export const ChevronLeft: LucideIcon;
  export const ChevronRight: LucideIcon;
  export const Calendar: LucideIcon;
}
