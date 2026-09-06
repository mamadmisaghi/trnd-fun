"use client";

import { forwardRef, useEffect, useState } from "react";
import NextLink from "next/link";
import { useParams as useNextParams, usePathname, useRouter } from "next/navigation";

/** Small adapter used while preserving the original terminal components. */
export const Link = forwardRef(function Link({ to, href, replace, ...props }, ref) {
  return <NextLink ref={ref} href={href ?? to ?? "/"} replace={replace} {...props} />;
});

export function useNavigate() {
  const router = useRouter();
  return (target) => {
    if (typeof target === "number") return target < 0 ? router.back() : router.forward();
    return router.push(target);
  };
}

export function useParams() { return useNextParams(); }
export function useSearchParams() {
  const [params, setParams] = useState(() => new URLSearchParams());
  useEffect(() => setParams(new URLSearchParams(window.location.search)), []);
  return [params];
}
export function useLocation() {
  const pathname = usePathname();
  return { pathname, hash: typeof window === "undefined" ? "" : window.location.hash };
}
export function useNavigationType() { return "PUSH"; }
