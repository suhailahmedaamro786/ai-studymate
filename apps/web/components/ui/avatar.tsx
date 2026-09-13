"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  initials?: string;
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ src, alt, initials, className, ...props }, ref) => {
    const [errored, setErrored] = React.useState(false);

    const showFallback = !src || errored;

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
          className
        )}
        {...props}
      >
        {!showFallback && (
          <Image
            src={src}
            alt={alt || "Avatar"}
            fill
            className="object-cover"
            onError={() => setErrored(true)}
            sizes="(max-width: 768px) 100vw, 80px"
          />
        )}
        {showFallback && (
          <div
            className={cn(
              "flex h-full w-full items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-sm select-none"
            )}
          >
            {initials}
          </div>
        )}
      </div>
    );
  }
);
Avatar.displayName = "Avatar";

export { Avatar };
