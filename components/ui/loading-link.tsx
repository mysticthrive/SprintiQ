"use client";

import { useRouter } from "next/navigation";
import { ReactNode } from "react";
import { useNavigationLoading } from "@/contexts/loading-context";

interface LoadingLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  loadingMessage?: string;
  onClick?: () => void;
}

export function LoadingLink({
  href,
  children,
  className,
  loadingMessage,
  onClick,
}: LoadingLinkProps) {
  const router = useRouter();
  const { withLoadingNavigation } = useNavigationLoading();

  const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    if (onClick) {
      onClick();
    }

    await withLoadingNavigation(() => router.push(href), loadingMessage);
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className={`transition-opacity duration-200 hover:opacity-80 ${
        className || ""
      }`}
    >
      {children}
    </a>
  );
}
