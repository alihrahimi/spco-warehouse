import * as AvatarPrimitive from "@radix-ui/react-avatar";

import { cn } from "@/lib/utils";

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map((word) => word[0]).join("");
}

export interface AvatarProps {
  name: string;
  imageUrl?: string | null;
  size?: number;
  className?: string;
}

/** Falls back to the person's initials (from `name`) whenever `imageUrl` is absent or fails to load. */
export function Avatar({ name, imageUrl, size = 40, className }: AvatarProps) {
  return (
    <AvatarPrimitive.Root
      className={cn("flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-light", className)}
      style={{ width: size, height: size }}
    >
      {imageUrl ? <AvatarPrimitive.Image src={imageUrl} alt={name} className="size-full object-cover" /> : null}
      <AvatarPrimitive.Fallback
        delayMs={imageUrl ? 400 : 0}
        className="text-body-small font-medium text-primary"
      >
        {getInitials(name)}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}
