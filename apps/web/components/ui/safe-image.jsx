"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export default function SafeImage({ src, alt = "", className, imageClassName, ...props }) {
  const ref = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
    const image = ref.current;
    if (image?.complete && image.naturalWidth === 0) setFailed(true);
  }, [src]);

  return (
    <span className={cn("relative inline-block overflow-hidden bg-deep bg-[url('/viral-terminal-mark.svg')] bg-center bg-no-repeat bg-[length:48%]", className)} aria-hidden={alt ? undefined : true}>
      {!failed && <img ref={ref} src={src} alt={alt} onError={() => setFailed(true)} onLoad={(event) => { if (event.currentTarget.naturalWidth === 0) setFailed(true); }} className={cn("absolute inset-0 h-full w-full object-cover", imageClassName)} {...props} />}
    </span>
  );
}
