import type { BaseStorageAdapter } from './adapters/BaseStorageAdapter.js'
import { createUploadProcessors } from './createProcessors.js'
import type { ModelNames, UploadsConfig } from './prismaExtension.js'
import { createUploadsExtension } from './prismaExtension.js'
import type { UrlSigner } from './UrlSigner.js'

type SetupStorageOptions<MNames extends ModelNames> = {
  uploadsConfig: UploadsConfig<MNames>
  storageAdapter: BaseStorageAdapter
  urlSigner?: UrlSigner
}

export const setupStorage = <MNames extends ModelNames>({
  uploadsConfig,
  storageAdapter,
  urlSigner,
}: SetupStorageOptions<MNames>) => {
  const prismaExtension = createUploadsExtension(
    uploadsConfig,
    storageAdapter,
    urlSigner,
  )

  const filesToStorage = createUploadProcessors(uploadsConfig, storageAdapter)

  return {
    storagePrismaExtension: prismaExtension,
    filesToStorage,
  }
}

export type { ModelNames, UploadsConfig } from './prismaExtension.js'
