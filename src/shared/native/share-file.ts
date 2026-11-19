import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

function downloadBlobOnWeb(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

/**
 * Web: classic download. Native: write to cache and open the system share sheet.
 */
export async function shareOrDownloadFile(options: {
  blob: Blob
  fileName: string
  title?: string
  dialogTitle?: string
}): Promise<void> {
  const { blob, fileName, title, dialogTitle } = options

  if (!Capacitor.isNativePlatform()) {
    downloadBlobOnWeb(blob, fileName)
    return
  }

  const base64 = await blobToBase64(blob)
  const path = `exports/${fileName}`
  const written = await Filesystem.writeFile({
    path,
    data: base64,
    directory: Directory.Cache,
    recursive: true,
  })

  await Share.share({
    title: title ?? fileName,
    dialogTitle: dialogTitle ?? title ?? fileName,
    files: [written.uri],
    url: written.uri,
  })
}
