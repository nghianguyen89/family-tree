// Synthetic browser fixture. No authentication, storage or family data.
import { useState } from 'react'
import { createRoot } from 'react-dom/client'

import AvatarCropDialog from '../../components/AvatarCropDialog'
import { I18nProvider } from '../../lib/i18n/I18nProvider'

function Fixture() {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState('original')
  return (
    <I18nProvider initialLocale='vi'>
      <button
        id='open-crop'
        onClick={async () => {
          const canvas = document.createElement('canvas')
          canvas.width = 1200
          canvas.height = 600
          const context = canvas.getContext('2d')!
          for (const [i, color] of [
            '#ff0000',
            '#00ff00',
            '#0000ff'
          ].entries()) {
            context.fillStyle = color
            context.fillRect(i * 400, 0, 400, 600)
          }
          const blob = await new Promise<Blob>((resolve) =>
            canvas.toBlob((value) => resolve(value!), 'image/png')
          )
          setFile(
            new File([blob], 'synthetic-group.png', { type: 'image/png' })
          )
        }}>
        Open crop
      </button>
      <output id='result'>{result}</output>
      {file && (
        <AvatarCropDialog
          file={file}
          onCancel={() => setFile(null)}
          onConfirm={async (cropped) => {
            const bitmap = await createImageBitmap(cropped)
            const canvas = document.createElement('canvas')
            canvas.width = bitmap.width
            canvas.height = bitmap.height
            const context = canvas.getContext('2d')!
            context.drawImage(bitmap, 0, 0)
            setResult(
              JSON.stringify({
                width: bitmap.width,
                height: bitmap.height,
                type: cropped.type,
                pixel: Array.from(
                  context.getImageData(
                    Math.floor(bitmap.width / 2),
                    Math.floor(bitmap.height / 2),
                    1,
                    1
                  ).data
                )
              })
            )
            bitmap.close()
            setFile(null)
          }}
        />
      )}
    </I18nProvider>
  )
}

createRoot(document.getElementById('root')!).render(<Fixture />)
