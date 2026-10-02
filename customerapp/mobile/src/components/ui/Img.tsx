import { Image as ExpoImage, type ImageProps as ExpoImageProps } from 'expo-image'
import { withUniwind } from 'uniwind'
import { publicAsset } from '@/lib/publicAsset'

const StyledImage = withUniwind(ExpoImage)

/**
 * The app's image: expo-image (cached, decoded off the JS thread, SVG-capable)
 * with className support, taking either a web path from the catalog
 * (`src="/photos/geyser/1.jpg"`) or a ready source.
 *
 * The web app's `next/image` with `fill` becomes `className="absolute inset-0"`
 * here, and `object-cover` becomes `contentFit="cover"` (the default).
 */
export interface ImgProps extends Omit<ExpoImageProps, 'source' | 'style'> {
  src?: string | null
  source?: ExpoImageProps['source']
  className?: string
  /** Read out; pass '' for a decorative picture. */
  alt?: string
}

export function Img({ src, source, alt, contentFit = 'cover', className, ...props }: ImgProps) {
  const resolved = source ?? publicAsset(src)
  return (
    <StyledImage
      source={resolved}
      contentFit={contentFit}
      transition={150}
      accessible={Boolean(alt)}
      accessibilityLabel={alt || undefined}
      className={className}
      {...props}
    />
  )
}
