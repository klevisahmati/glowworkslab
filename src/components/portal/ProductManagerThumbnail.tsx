import { useEffect, useState } from 'react'
import { fetchManagedProductImages } from '../../lib/product-images'

type Props = {
  productId: string
  productTitle: string
}

export function ProductManagerThumbnail({
  productId,
  productTitle,
}: Props) {
  const [imageUrl, setImageUrl] = useState('')
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let active = true

    setImageUrl('')
    setFailed(false)

    fetchManagedProductImages(productId)
      .then((images) => {
        if (active && images.length > 0) {
          setImageUrl(images[0].signedUrl)
        }
      })
      .catch(() => {
        if (active) setFailed(true)
      })

    return () => {
      active = false
    }
  }, [productId])

  return (
    <div className="product-manager-item-avatar">
      {imageUrl && !failed ? (
        <img
          src={imageUrl}
          alt={productTitle}
          loading="lazy"
          onError={() => setFailed(true)}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: 'inherit',
          }}
        />
      ) : (
        <span>3D</span>
      )}
    </div>
  )
}