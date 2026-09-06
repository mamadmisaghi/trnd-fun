"use client";

import { forwardRef } from "react";

/** Lightweight image primitive replacing the prior editor-specific image layer. */
export const Image = forwardRef(function Image({ src, alt = "", fittingType, ...props }, ref) {
  return <img ref={ref} src={src} alt={alt} loading="lazy" {...props} />;
});
