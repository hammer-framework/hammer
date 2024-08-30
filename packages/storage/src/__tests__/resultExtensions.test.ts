import { describe, it, expect, vi } from 'vitest'

import { MemoryStorage } from '../adapters/MemoryStorage/MemoryStorage.js'
import { setupStorage } from '../index.js'
import type { UploadsConfig } from '../prismaExtension.js'
import { UrlSigner } from '../UrlSigner.js'

// @MARK: use the local prisma client in the test
import { PrismaClient } from './prisma-client/index.js'

vi.mock('@redwoodjs/project-config', async (importOriginal) => {
  const originalProjectConfig = (await importOriginal()) as any
  return {
    ...originalProjectConfig,
    getConfig: () => {
      return {
        web: {
          apiUrl: '/.redwood/functions',
        },
      }
    },
  }
})

describe('Result extensions', () => {
  const uploadsConfig: UploadsConfig = {
    dummy: {
      fields: 'uploadField',
    },
    dumbo: {
      fields: ['firstUpload', 'secondUpload'],
    },
  }

  const { storagePrismaExtension } = setupStorage({
    uploadsConfig,
    storageAdapter: new MemoryStorage({
      baseDir: '/tmp',
    }),
    urlSigner: new UrlSigner({
      endpoint: '/signed-url',
      secret: 'my-sekret',
    }),
  })

  const prismaClient = new PrismaClient().$extends(storagePrismaExtension)

  describe('withSignedUrl', () => {
    it('Generates signed urls for each upload field', async () => {
      const dumbo = await prismaClient.dumbo.create({
        data: {
          firstUpload: '/dumbo/first.txt',
          secondUpload: '/dumbo/second.txt',
        },
      })

      const signedUrlDumbo = await dumbo.withSignedUrl({
        expiresIn: 254,
      })
      expect(signedUrlDumbo.firstUpload).toContain(
        '/.redwood/functions/signed-url',
      )
      expect(signedUrlDumbo.firstUpload).toContain('path=%2Fdumbo%2Ffirst.txt')
      expect(signedUrlDumbo.secondUpload).toContain(
        'path=%2Fdumbo%2Fsecond.txt',
      )
    })
  })
})
