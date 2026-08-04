import Image from "next/image";

type PixelAvatarProps = {
  size?: number;
  className?: string;
};

export default function PixelAvatar({
  size = 96,
  className,
}: PixelAvatarProps) {
  return (
    <Image
      src="/pixels/avatar-circle.png"
      alt="头像"
      width={size}
      height={size}
      priority
      className={`rounded-full object-cover ${className ?? ""}`}
    />
  );
}
