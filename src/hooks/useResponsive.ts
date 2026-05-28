import { useWindowDimensions } from "react-native";

const TABLET_BREAKPOINT = 768;

export interface ResponsiveInfo {
  width: number;
  height: number;
  isTablet: boolean;
  isLandscape: boolean;
  isTabletLandscape: boolean;
}

export function useResponsive(): ResponsiveInfo {
  const { width, height } = useWindowDimensions();
  const isTablet = Math.min(width, height) >= TABLET_BREAKPOINT;
  const isLandscape = width > height;
  return {
    width,
    height,
    isTablet,
    isLandscape,
    isTabletLandscape: isTablet && isLandscape,
  };
}
