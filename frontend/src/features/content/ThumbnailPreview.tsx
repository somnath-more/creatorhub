import { useEffect, useRef } from "react";

export function ThumbnailPreview({
  file,
  className = "",
}: {
  file: File;
  className?: string;
}) {
  const image = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const url = URL.createObjectURL(file);
    if (image.current) image.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return (
    <img ref={image} alt="Selected thumbnail preview" className={className} />
  );
}
