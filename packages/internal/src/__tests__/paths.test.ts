import path from 'path'

import {
  processPagesDir,
  resolveFile,
  ensurePosixPath,
  importStatementPath,
  getBaseDir,
  getBaseDirFromFile,
  getPaths,
} from '../paths'

const RWJS_CWD = process.env.RWJS_CWD

describe('paths', () => {
  describe('within empty project', () => {
    const FIXTURE_BASEDIR = path.join(
      __dirname,
      '..',
      '..',
      '..',
      '..',
      '__fixtures__',
      'empty-project'
    )

    beforeAll(() => {
      process.env.RWJS_CWD = FIXTURE_BASEDIR
    })
    afterAll(() => {
      process.env.RWJS_CWD = RWJS_CWD
    })

    it('finds the correct base directory', () => {
      expect(getBaseDir()).toBe(FIXTURE_BASEDIR)
    })

    it('finds the correct base directory from a file', () => {
      const projectFilePath = path.join(
        FIXTURE_BASEDIR,
        'web',
        'src',
        'pages',
        'AboutPage'
      )
      expect(getBaseDirFromFile(projectFilePath)).toBe(FIXTURE_BASEDIR)
    })

    it('gets the correct paths', () => {
      const expectedPaths = {
        base: FIXTURE_BASEDIR,
        generated: {
          base: path.join(FIXTURE_BASEDIR, '.redwood'),
          schema: path.join(FIXTURE_BASEDIR, '.redwood', 'schema.graphql'),
          types: {
            includes: path.join(
              FIXTURE_BASEDIR,
              '.redwood',
              'types',
              'includes'
            ),
            mirror: path.join(FIXTURE_BASEDIR, '.redwood', 'types', 'mirror'),
          },
          prebuild: path.join(FIXTURE_BASEDIR, '.redwood', 'prebuild'),
        },
        scripts: path.join(FIXTURE_BASEDIR, 'scripts'),
        api: {
          base: path.join(FIXTURE_BASEDIR, 'api'),
          dataMigrations: path.join(
            FIXTURE_BASEDIR,
            'api',
            'db',
            'dataMigrations'
          ),
          db: path.join(FIXTURE_BASEDIR, 'api', 'db'),
          dbSchema: path.join(FIXTURE_BASEDIR, 'api', 'db', 'schema.prisma'),
          functions: path.join(FIXTURE_BASEDIR, 'api', 'src', 'functions'),
          graphql: path.join(FIXTURE_BASEDIR, 'api', 'src', 'graphql'),
          lib: path.join(FIXTURE_BASEDIR, 'api', 'src', 'lib'),
          generators: path.join(FIXTURE_BASEDIR, 'api', 'generators'),
          config: path.join(FIXTURE_BASEDIR, 'api', 'src', 'config'),
          services: path.join(FIXTURE_BASEDIR, 'api', 'src', 'services'),
          directives: path.join(FIXTURE_BASEDIR, 'api', 'src', 'directives'),
          src: path.join(FIXTURE_BASEDIR, 'api', 'src'),
          dist: path.join(FIXTURE_BASEDIR, 'api', 'dist'),
          types: path.join(FIXTURE_BASEDIR, 'api', 'types'),
          models: path.join(FIXTURE_BASEDIR, 'api', 'src', 'models'),
        },
        web: {
          routes: path.join(FIXTURE_BASEDIR, 'web', 'src', 'Routes.tsx'),
          base: path.join(FIXTURE_BASEDIR, 'web'),
          pages: path.join(FIXTURE_BASEDIR, 'web', 'src', 'pages/'),
          components: path.join(FIXTURE_BASEDIR, 'web', 'src', 'components'),
          layouts: path.join(FIXTURE_BASEDIR, 'web', 'src', 'layouts/'),
          src: path.join(FIXTURE_BASEDIR, 'web', 'src'),
          generators: path.join(FIXTURE_BASEDIR, 'web', 'generators'),
          app: path.join(FIXTURE_BASEDIR, 'web', 'src', 'App.tsx'),
          index: null,
          config: path.join(FIXTURE_BASEDIR, 'web', 'config'),
          webpack: path.join(
            FIXTURE_BASEDIR,
            'web',
            'config',
            'webpack.config.js'
          ),
          postcss: path.join(
            FIXTURE_BASEDIR,
            'web',
            'config',
            'postcss.config.js'
          ),
          storybookConfig: path.join(
            FIXTURE_BASEDIR,
            'web',
            'config',
            'storybook.config.js'
          ),
          storybookPreviewConfig: path.join(
            FIXTURE_BASEDIR,
            'web',
            'config',
            'storybook.preview.js'
          ),
          storybookManagerConfig: path.join(
            FIXTURE_BASEDIR,
            'web',
            'config',
            'storybook.manager.js'
          ),
          dist: path.join(FIXTURE_BASEDIR, 'web', 'dist'),
          types: path.join(FIXTURE_BASEDIR, 'web', 'types'),
        },
      }

      const paths = getPaths()
      expect(paths).toStrictEqual(expectedPaths)
    })

    it('switches windows slashes in import statements', () => {
      const originalPlatform = process.platform
      Object.defineProperty(process, 'platform', {
        value: 'win32',
      })

      const inputPath = 'C:\\Users\\Bob\\dev\\Redwood\\UserPage\\UserPage'
      const outputPath = importStatementPath(inputPath)

      Object.defineProperty(process, 'platform', {
        value: originalPlatform,
      })

      expect(outputPath).toEqual('C:/Users/Bob/dev/Redwood/UserPage/UserPage')
    })

    describe('processPagesDir', () => {
      it('it accurately finds and names the pages', () => {
        const pagesDir = path.join(FIXTURE_BASEDIR, 'web', 'src', 'pages')

        const pages = processPagesDir(pagesDir)

        expect(pages.length).toEqual(2)

        const fatalErrorPage = pages.find(
          (page) => page.importName === 'FatalErrorPage'
        )
        expect(fatalErrorPage).not.toBeUndefined()
        expect(fatalErrorPage.importPath).toEqual(
          importStatementPath(
            path.join(pagesDir, 'FatalErrorPage/FatalErrorPage')
          )
        )

        const notFoundPage = pages.find(
          (page) => page.importName === 'NotFoundPage'
        )
        expect(notFoundPage).not.toBeUndefined()
        expect(notFoundPage.importPath).toEqual(
          importStatementPath(path.join(pagesDir, 'NotFoundPage/NotFoundPage'))
        )
      })
    })

    describe('resolveFile', () => {
      const p = resolveFile(path.join(FIXTURE_BASEDIR, 'web', 'src', 'App'))
      expect(path.extname(p)).toEqual('.tsx')

      const q = resolveFile(
        path.join(FIXTURE_BASEDIR, 'web', 'public', 'favicon')
      )
      expect(q).toBe(null)
    })

    describe('ensurePosixPath', () => {
      it('Returns unmodified input if not on Windows', () => {
        const originalPlatform = process.platform
        Object.defineProperty(process, 'platform', {
          value: 'NotWindows',
        })

        const testPath = 'X:\\some\\weird\\path'
        const posixPath = ensurePosixPath(testPath)

        Object.defineProperty(process, 'platform', {
          value: originalPlatform,
        })

        expect(posixPath).toEqual(testPath)
      })

      it('Transforms paths on Windows', () => {
        const originalPlatform = process.platform
        Object.defineProperty(process, 'platform', {
          value: 'win32',
        })

        const testPath = '..\\some\\relative\\path'
        const posixPath = ensurePosixPath(testPath)

        Object.defineProperty(process, 'platform', {
          value: originalPlatform,
        })

        expect(posixPath).toEqual('../some/relative/path')
      })

      it('Handles drive letters', () => {
        const originalPlatform = process.platform
        Object.defineProperty(process, 'platform', {
          value: 'win32',
        })

        const testPath = 'C:\\some\\full\\path\\to\\file.ext'
        const posixPath = ensurePosixPath(testPath)

        Object.defineProperty(process, 'platform', {
          value: originalPlatform,
        })

        expect(posixPath).toEqual('/c/some/full/path/to/file.ext')
      })
    })
  })

  describe('within example-todo-main project', () => {
    const FIXTURE_BASEDIR = path.join(
      __dirname,
      '..',
      '..',
      '..',
      '..',
      '__fixtures__',
      'example-todo-main'
    )

    beforeAll(() => {
      process.env.RWJS_CWD = FIXTURE_BASEDIR
    })
    afterAll(() => {
      process.env.RWJS_CWD = RWJS_CWD
    })

    it('finds the correct base directory', () => {
      expect(getBaseDir()).toBe(FIXTURE_BASEDIR)
    })

    it('finds the correct base directory from a file', () => {
      const projectFilePath = path.join(
        FIXTURE_BASEDIR,
        'web',
        'src',
        'pages',
        'AboutPage'
      )
      expect(getBaseDirFromFile(projectFilePath)).toBe(FIXTURE_BASEDIR)
    })

    it('gets the correct paths', () => {
      const expectedPaths = {
        base: FIXTURE_BASEDIR,
        generated: {
          base: path.join(FIXTURE_BASEDIR, '.redwood'),
          schema: path.join(FIXTURE_BASEDIR, '.redwood', 'schema.graphql'),
          types: {
            includes: path.join(
              FIXTURE_BASEDIR,
              '.redwood',
              'types',
              'includes'
            ),
            mirror: path.join(FIXTURE_BASEDIR, '.redwood', 'types', 'mirror'),
          },
          prebuild: path.join(FIXTURE_BASEDIR, '.redwood', 'prebuild'),
        },
        scripts: path.join(FIXTURE_BASEDIR, 'scripts'),
        api: {
          base: path.join(FIXTURE_BASEDIR, 'api'),
          dataMigrations: path.join(
            FIXTURE_BASEDIR,
            'api',
            'db',
            'dataMigrations'
          ),
          db: path.join(FIXTURE_BASEDIR, 'api', 'db'),
          dbSchema: path.join(FIXTURE_BASEDIR, 'api', 'db', 'schema.prisma'),
          functions: path.join(FIXTURE_BASEDIR, 'api', 'src', 'functions'),
          graphql: path.join(FIXTURE_BASEDIR, 'api', 'src', 'graphql'),
          lib: path.join(FIXTURE_BASEDIR, 'api', 'src', 'lib'),
          generators: path.join(FIXTURE_BASEDIR, 'api', 'generators'),
          config: path.join(FIXTURE_BASEDIR, 'api', 'src', 'config'),
          services: path.join(FIXTURE_BASEDIR, 'api', 'src', 'services'),
          directives: path.join(FIXTURE_BASEDIR, 'api', 'src', 'directives'),
          src: path.join(FIXTURE_BASEDIR, 'api', 'src'),
          dist: path.join(FIXTURE_BASEDIR, 'api', 'dist'),
          types: path.join(FIXTURE_BASEDIR, 'api', 'types'),
          models: path.join(FIXTURE_BASEDIR, 'api', 'src', 'models'),
        },
        web: {
          routes: path.join(FIXTURE_BASEDIR, 'web', 'src', 'Routes.js'),
          base: path.join(FIXTURE_BASEDIR, 'web'),
          pages: path.join(FIXTURE_BASEDIR, 'web', 'src', 'pages/'),
          components: path.join(FIXTURE_BASEDIR, 'web', 'src', 'components'),
          layouts: path.join(FIXTURE_BASEDIR, 'web', 'src', 'layouts/'),
          src: path.join(FIXTURE_BASEDIR, 'web', 'src'),
          generators: path.join(FIXTURE_BASEDIR, 'web', 'generators'),
          app: path.join(FIXTURE_BASEDIR, 'web', 'src', 'App.js'),
          index: null,
          config: path.join(FIXTURE_BASEDIR, 'web', 'config'),
          webpack: path.join(
            FIXTURE_BASEDIR,
            'web',
            'config',
            'webpack.config.js'
          ),
          postcss: path.join(
            FIXTURE_BASEDIR,
            'web',
            'config',
            'postcss.config.js'
          ),
          storybookConfig: path.join(
            FIXTURE_BASEDIR,
            'web',
            'config',
            'storybook.config.js'
          ),
          storybookPreviewConfig: path.join(
            FIXTURE_BASEDIR,
            'web',
            'config',
            'storybook.preview.js'
          ),
          storybookManagerConfig: path.join(
            FIXTURE_BASEDIR,
            'web',
            'config',
            'storybook.manager.js'
          ),
          dist: path.join(FIXTURE_BASEDIR, 'web', 'dist'),
          types: path.join(FIXTURE_BASEDIR, 'web', 'types'),
        },
      }

      const paths = getPaths()
      expect(paths).toStrictEqual(expectedPaths)
    })

    it('switches windows slashes in import statements', () => {
      const originalPlatform = process.platform
      Object.defineProperty(process, 'platform', {
        value: 'win32',
      })

      const inputPath = 'C:\\Users\\Bob\\dev\\Redwood\\UserPage\\UserPage'
      const outputPath = importStatementPath(inputPath)

      Object.defineProperty(process, 'platform', {
        value: originalPlatform,
      })

      expect(outputPath).toEqual('C:/Users/Bob/dev/Redwood/UserPage/UserPage')
    })

    describe('processPagesDir', () => {
      it('it accurately finds and names the pages', () => {
        const pagesDir = path.join(FIXTURE_BASEDIR, 'web', 'src', 'pages')

        const pages = processPagesDir(pagesDir)

        expect(pages.length).toEqual(8)

        const adminEditUserPage = pages.find(
          (page) => page.importName === 'adminEditUserPage'
        )
        expect(adminEditUserPage).not.toBeUndefined()
        expect(adminEditUserPage.importPath).toEqual(
          importStatementPath(
            path.join(pagesDir, 'admin/EditUserPage/EditUserPage')
          )
        )

        const barPage = pages.find((page) => page.importName === 'BarPage')
        expect(barPage).not.toBeUndefined()
        expect(barPage.importPath).toEqual(
          importStatementPath(path.join(pagesDir, 'BarPage/BarPage'))
        )

        const fatalErrorPage = pages.find(
          (page) => page.importName === 'FatalErrorPage'
        )
        expect(fatalErrorPage).not.toBeUndefined()
        expect(fatalErrorPage.importPath).toEqual(
          importStatementPath(
            path.join(pagesDir, 'FatalErrorPage/FatalErrorPage')
          )
        )

        const fooPage = pages.find((page) => page.importName === 'FooPage')
        expect(fooPage).not.toBeUndefined()
        expect(fooPage.importPath).toEqual(
          importStatementPath(path.join(pagesDir, 'FooPage/FooPage'))
        )

        const homePage = pages.find((page) => page.importName === 'HomePage')
        expect(homePage).not.toBeUndefined()
        expect(homePage.importPath).toEqual(
          importStatementPath(path.join(pagesDir, 'HomePage/HomePage'))
        )

        const notFoundPage = pages.find(
          (page) => page.importName === 'NotFoundPage'
        )
        expect(notFoundPage).not.toBeUndefined()
        expect(notFoundPage.importPath).toEqual(
          importStatementPath(path.join(pagesDir, 'NotFoundPage/NotFoundPage'))
        )

        const typeScriptPage = pages.find(
          (page) => page.importName === 'TypeScriptPage'
        )
        expect(typeScriptPage).not.toBeUndefined()
        expect(typeScriptPage.importPath).toEqual(
          importStatementPath(
            path.join(pagesDir, 'TypeScriptPage/TypeScriptPage')
          )
        )

        const privatePage = pages.find(
          (page) => page.importName === 'PrivatePage'
        )
        expect(privatePage).not.toBeUndefined()
        expect(privatePage.importPath).toEqual(
          importStatementPath(path.join(pagesDir, 'PrivatePage/PrivatePage'))
        )
      })
    })

    describe('resolveFile', () => {
      const p = resolveFile(path.join(FIXTURE_BASEDIR, 'web', 'src', 'App'))
      expect(path.extname(p)).toEqual('.js')

      const q = resolveFile(
        path.join(FIXTURE_BASEDIR, 'web', 'public', 'favicon')
      )
      expect(q).toBe(null)
    })

    describe('ensurePosixPath', () => {
      it('Returns unmodified input if not on Windows', () => {
        const originalPlatform = process.platform
        Object.defineProperty(process, 'platform', {
          value: 'NotWindows',
        })

        const testPath = 'X:\\some\\weird\\path'
        const posixPath = ensurePosixPath(testPath)

        Object.defineProperty(process, 'platform', {
          value: originalPlatform,
        })

        expect(posixPath).toEqual(testPath)
      })

      it('Transforms paths on Windows', () => {
        const originalPlatform = process.platform
        Object.defineProperty(process, 'platform', {
          value: 'win32',
        })

        const testPath = '..\\some\\relative\\path'
        const posixPath = ensurePosixPath(testPath)

        Object.defineProperty(process, 'platform', {
          value: originalPlatform,
        })

        expect(posixPath).toEqual('../some/relative/path')
      })

      it('Handles drive letters', () => {
        const originalPlatform = process.platform
        Object.defineProperty(process, 'platform', {
          value: 'win32',
        })

        const testPath = 'C:\\some\\full\\path\\to\\file.ext'
        const posixPath = ensurePosixPath(testPath)

        Object.defineProperty(process, 'platform', {
          value: originalPlatform,
        })

        expect(posixPath).toEqual('/c/some/full/path/to/file.ext')
      })
    })
  })

  describe('within example-todo-main-with-errors project', () => {
    const FIXTURE_BASEDIR = path.join(
      __dirname,
      '..',
      '..',
      '..',
      '..',
      '__fixtures__',
      'example-todo-main-with-errors'
    )

    beforeAll(() => {
      process.env.RWJS_CWD = FIXTURE_BASEDIR
    })
    afterAll(() => {
      process.env.RWJS_CWD = RWJS_CWD
    })

    it('finds the correct base directory', () => {
      expect(getBaseDir()).toBe(FIXTURE_BASEDIR)
    })

    it('finds the correct base directory from a file', () => {
      const projectFilePath = path.join(
        FIXTURE_BASEDIR,
        'web',
        'src',
        'pages',
        'AboutPage'
      )
      expect(getBaseDirFromFile(projectFilePath)).toBe(FIXTURE_BASEDIR)
    })

    it('gets the correct paths', () => {
      const expectedPaths = {
        base: FIXTURE_BASEDIR,
        generated: {
          base: path.join(FIXTURE_BASEDIR, '.redwood'),
          schema: path.join(FIXTURE_BASEDIR, '.redwood', 'schema.graphql'),
          types: {
            includes: path.join(
              FIXTURE_BASEDIR,
              '.redwood',
              'types',
              'includes'
            ),
            mirror: path.join(FIXTURE_BASEDIR, '.redwood', 'types', 'mirror'),
          },
          prebuild: path.join(FIXTURE_BASEDIR, '.redwood', 'prebuild'),
        },
        scripts: path.join(FIXTURE_BASEDIR, 'scripts'),
        api: {
          base: path.join(FIXTURE_BASEDIR, 'api'),
          dataMigrations: path.join(
            FIXTURE_BASEDIR,
            'api',
            'db',
            'dataMigrations'
          ),
          db: path.join(FIXTURE_BASEDIR, 'api', 'db'),
          dbSchema: path.join(FIXTURE_BASEDIR, 'api', 'db', 'schema.prisma'),
          functions: path.join(FIXTURE_BASEDIR, 'api', 'src', 'functions'),
          graphql: path.join(FIXTURE_BASEDIR, 'api', 'src', 'graphql'),
          lib: path.join(FIXTURE_BASEDIR, 'api', 'src', 'lib'),
          generators: path.join(FIXTURE_BASEDIR, 'api', 'generators'),
          config: path.join(FIXTURE_BASEDIR, 'api', 'src', 'config'),
          services: path.join(FIXTURE_BASEDIR, 'api', 'src', 'services'),
          directives: path.join(FIXTURE_BASEDIR, 'api', 'src', 'directives'),
          src: path.join(FIXTURE_BASEDIR, 'api', 'src'),
          dist: path.join(FIXTURE_BASEDIR, 'api', 'dist'),
          types: path.join(FIXTURE_BASEDIR, 'api', 'types'),
          models: path.join(FIXTURE_BASEDIR, 'api', 'src', 'models'),
        },
        web: {
          routes: path.join(FIXTURE_BASEDIR, 'web', 'src', 'Routes.js'),
          base: path.join(FIXTURE_BASEDIR, 'web'),
          pages: path.join(FIXTURE_BASEDIR, 'web', 'src', 'pages/'),
          components: path.join(FIXTURE_BASEDIR, 'web', 'src', 'components'),
          layouts: path.join(FIXTURE_BASEDIR, 'web', 'src', 'layouts/'),
          src: path.join(FIXTURE_BASEDIR, 'web', 'src'),
          generators: path.join(FIXTURE_BASEDIR, 'web', 'generators'),
          app: null,
          index: path.join(FIXTURE_BASEDIR, 'web', 'src', 'index.js'),
          config: path.join(FIXTURE_BASEDIR, 'web', 'config'),
          webpack: path.join(
            FIXTURE_BASEDIR,
            'web',
            'config',
            'webpack.config.js'
          ),
          postcss: path.join(
            FIXTURE_BASEDIR,
            'web',
            'config',
            'postcss.config.js'
          ),
          storybookConfig: path.join(
            FIXTURE_BASEDIR,
            'web',
            'config',
            'storybook.config.js'
          ),
          storybookPreviewConfig: path.join(
            FIXTURE_BASEDIR,
            'web',
            'config',
            'storybook.preview.js'
          ),
          storybookManagerConfig: path.join(
            FIXTURE_BASEDIR,
            'web',
            'config',
            'storybook.manager.js'
          ),
          dist: path.join(FIXTURE_BASEDIR, 'web', 'dist'),
          types: path.join(FIXTURE_BASEDIR, 'web', 'types'),
        },
      }

      const paths = getPaths()
      expect(paths).toStrictEqual(expectedPaths)
    })

    it('switches windows slashes in import statements', () => {
      const originalPlatform = process.platform
      Object.defineProperty(process, 'platform', {
        value: 'win32',
      })

      const inputPath = 'C:\\Users\\Bob\\dev\\Redwood\\UserPage\\UserPage'
      const outputPath = importStatementPath(inputPath)

      Object.defineProperty(process, 'platform', {
        value: originalPlatform,
      })

      expect(outputPath).toEqual('C:/Users/Bob/dev/Redwood/UserPage/UserPage')
    })

    describe('processPagesDir', () => {
      it('it accurately finds and names the pages', () => {
        const pagesDir = path.join(FIXTURE_BASEDIR, 'web', 'src', 'pages')

        const pages = processPagesDir(pagesDir)

        expect(pages.length).toEqual(3)

        const fatalErrorPage = pages.find(
          (page) => page.importName === 'FatalErrorPage'
        )
        expect(fatalErrorPage).not.toBeUndefined()
        expect(fatalErrorPage.importPath).toEqual(
          importStatementPath(
            path.join(pagesDir, 'FatalErrorPage/FatalErrorPage')
          )
        )

        const homePage = pages.find((page) => page.importName === 'HomePage')
        expect(homePage).not.toBeUndefined()
        expect(homePage.importPath).toEqual(
          importStatementPath(path.join(pagesDir, 'HomePage/HomePage'))
        )

        const notFoundPage = pages.find(
          (page) => page.importName === 'NotFoundPage'
        )
        expect(notFoundPage).not.toBeUndefined()
        expect(notFoundPage.importPath).toEqual(
          importStatementPath(path.join(pagesDir, 'NotFoundPage/NotFoundPage'))
        )
      })
    })

    describe('resolveFile', () => {
      const p = resolveFile(path.join(FIXTURE_BASEDIR, 'web', 'src', 'index'))
      expect(path.extname(p)).toEqual('.js')

      const q = resolveFile(
        path.join(FIXTURE_BASEDIR, 'web', 'public', 'favicon')
      )
      expect(q).toBe(null)
    })

    describe('ensurePosixPath', () => {
      it('Returns unmodified input if not on Windows', () => {
        const originalPlatform = process.platform
        Object.defineProperty(process, 'platform', {
          value: 'NotWindows',
        })

        const testPath = 'X:\\some\\weird\\path'
        const posixPath = ensurePosixPath(testPath)

        Object.defineProperty(process, 'platform', {
          value: originalPlatform,
        })

        expect(posixPath).toEqual(testPath)
      })

      it('Transforms paths on Windows', () => {
        const originalPlatform = process.platform
        Object.defineProperty(process, 'platform', {
          value: 'win32',
        })

        const testPath = '..\\some\\relative\\path'
        const posixPath = ensurePosixPath(testPath)

        Object.defineProperty(process, 'platform', {
          value: originalPlatform,
        })

        expect(posixPath).toEqual('../some/relative/path')
      })

      it('Handles drive letters', () => {
        const originalPlatform = process.platform
        Object.defineProperty(process, 'platform', {
          value: 'win32',
        })

        const testPath = 'C:\\some\\full\\path\\to\\file.ext'
        const posixPath = ensurePosixPath(testPath)

        Object.defineProperty(process, 'platform', {
          value: originalPlatform,
        })

        expect(posixPath).toEqual('/c/some/full/path/to/file.ext')
      })
    })
  })

  describe('within test project', () => {
    const FIXTURE_BASEDIR = path.join(
      __dirname,
      '..',
      '..',
      '..',
      '..',
      '__fixtures__',
      'test-project'
    )

    beforeAll(() => {
      process.env.RWJS_CWD = FIXTURE_BASEDIR
    })
    afterAll(() => {
      process.env.RWJS_CWD = RWJS_CWD
    })

    it('finds the correct base directory', () => {
      expect(getBaseDir()).toBe(FIXTURE_BASEDIR)
    })

    it('finds the correct base directory from a file', () => {
      const projectFilePath = path.join(
        FIXTURE_BASEDIR,
        'web',
        'src',
        'pages',
        'AboutPage'
      )
      expect(getBaseDirFromFile(projectFilePath)).toBe(FIXTURE_BASEDIR)
    })

    it('gets the correct paths', () => {
      const expectedPaths = {
        base: FIXTURE_BASEDIR,
        generated: {
          base: path.join(FIXTURE_BASEDIR, '.redwood'),
          schema: path.join(FIXTURE_BASEDIR, '.redwood', 'schema.graphql'),
          types: {
            includes: path.join(
              FIXTURE_BASEDIR,
              '.redwood',
              'types',
              'includes'
            ),
            mirror: path.join(FIXTURE_BASEDIR, '.redwood', 'types', 'mirror'),
          },
          prebuild: path.join(FIXTURE_BASEDIR, '.redwood', 'prebuild'),
        },
        scripts: path.join(FIXTURE_BASEDIR, 'scripts'),
        api: {
          base: path.join(FIXTURE_BASEDIR, 'api'),
          dataMigrations: path.join(
            FIXTURE_BASEDIR,
            'api',
            'db',
            'dataMigrations'
          ),
          db: path.join(FIXTURE_BASEDIR, 'api', 'db'),
          dbSchema: path.join(FIXTURE_BASEDIR, 'api', 'db', 'schema.prisma'),
          functions: path.join(FIXTURE_BASEDIR, 'api', 'src', 'functions'),
          graphql: path.join(FIXTURE_BASEDIR, 'api', 'src', 'graphql'),
          lib: path.join(FIXTURE_BASEDIR, 'api', 'src', 'lib'),
          generators: path.join(FIXTURE_BASEDIR, 'api', 'generators'),
          config: path.join(FIXTURE_BASEDIR, 'api', 'src', 'config'),
          services: path.join(FIXTURE_BASEDIR, 'api', 'src', 'services'),
          directives: path.join(FIXTURE_BASEDIR, 'api', 'src', 'directives'),
          src: path.join(FIXTURE_BASEDIR, 'api', 'src'),
          dist: path.join(FIXTURE_BASEDIR, 'api', 'dist'),
          types: path.join(FIXTURE_BASEDIR, 'api', 'types'),
          models: path.join(FIXTURE_BASEDIR, 'api', 'src', 'models'),
        },
        web: {
          routes: path.join(FIXTURE_BASEDIR, 'web', 'src', 'Routes.tsx'),
          base: path.join(FIXTURE_BASEDIR, 'web'),
          pages: path.join(FIXTURE_BASEDIR, 'web', 'src', 'pages/'),
          components: path.join(FIXTURE_BASEDIR, 'web', 'src', 'components'),
          layouts: path.join(FIXTURE_BASEDIR, 'web', 'src', 'layouts/'),
          src: path.join(FIXTURE_BASEDIR, 'web', 'src'),
          generators: path.join(FIXTURE_BASEDIR, 'web', 'generators'),
          app: path.join(FIXTURE_BASEDIR, 'web', 'src', 'App.tsx'),
          index: null,
          config: path.join(FIXTURE_BASEDIR, 'web', 'config'),
          webpack: path.join(
            FIXTURE_BASEDIR,
            'web',
            'config',
            'webpack.config.js'
          ),
          postcss: path.join(
            FIXTURE_BASEDIR,
            'web',
            'config',
            'postcss.config.js'
          ),
          storybookConfig: path.join(
            FIXTURE_BASEDIR,
            'web',
            'config',
            'storybook.config.js'
          ),
          storybookPreviewConfig: path.join(
            FIXTURE_BASEDIR,
            'web',
            'config',
            'storybook.preview.js'
          ),
          storybookManagerConfig: path.join(
            FIXTURE_BASEDIR,
            'web',
            'config',
            'storybook.manager.js'
          ),
          dist: path.join(FIXTURE_BASEDIR, 'web', 'dist'),
          types: path.join(FIXTURE_BASEDIR, 'web', 'types'),
        },
      }

      const paths = getPaths()
      expect(paths).toStrictEqual(expectedPaths)
    })

    it('switches windows slashes in import statements', () => {
      const originalPlatform = process.platform
      Object.defineProperty(process, 'platform', {
        value: 'win32',
      })

      const inputPath = 'C:\\Users\\Bob\\dev\\Redwood\\UserPage\\UserPage'
      const outputPath = importStatementPath(inputPath)

      Object.defineProperty(process, 'platform', {
        value: originalPlatform,
      })

      expect(outputPath).toEqual('C:/Users/Bob/dev/Redwood/UserPage/UserPage')
    })

    describe('processPagesDir', () => {
      it('it accurately finds and names the pages', () => {
        const pagesDir = path.resolve(
          __dirname,
          '../../../../__fixtures__/example-todo-main/web/src/pages'
        )

        const pages = processPagesDir(pagesDir)

        expect(pages.length).toEqual(8)

        const adminEditUserPage = pages.find(
          (page) => page.importName === 'adminEditUserPage'
        )
        expect(adminEditUserPage).not.toBeUndefined()
        expect(adminEditUserPage.importPath).toEqual(
          importStatementPath(
            path.join(pagesDir, 'admin/EditUserPage/EditUserPage')
          )
        )

        const barPage = pages.find((page) => page.importName === 'BarPage')
        expect(barPage).not.toBeUndefined()
        expect(barPage.importPath).toEqual(
          importStatementPath(path.join(pagesDir, 'BarPage/BarPage'))
        )

        const fatalErrorPage = pages.find(
          (page) => page.importName === 'FatalErrorPage'
        )
        expect(fatalErrorPage).not.toBeUndefined()
        expect(fatalErrorPage.importPath).toEqual(
          importStatementPath(
            path.join(pagesDir, 'FatalErrorPage/FatalErrorPage')
          )
        )

        const fooPage = pages.find((page) => page.importName === 'FooPage')
        expect(fooPage).not.toBeUndefined()
        expect(fooPage.importPath).toEqual(
          importStatementPath(path.join(pagesDir, 'FooPage/FooPage'))
        )

        const homePage = pages.find((page) => page.importName === 'HomePage')
        expect(homePage).not.toBeUndefined()
        expect(homePage.importPath).toEqual(
          importStatementPath(path.join(pagesDir, 'HomePage/HomePage'))
        )

        const notFoundPage = pages.find(
          (page) => page.importName === 'NotFoundPage'
        )
        expect(notFoundPage).not.toBeUndefined()
        expect(notFoundPage.importPath).toEqual(
          importStatementPath(path.join(pagesDir, 'NotFoundPage/NotFoundPage'))
        )

        const typeScriptPage = pages.find(
          (page) => page.importName === 'TypeScriptPage'
        )
        expect(typeScriptPage).not.toBeUndefined()
        expect(typeScriptPage.importPath).toEqual(
          importStatementPath(
            path.join(pagesDir, 'TypeScriptPage/TypeScriptPage')
          )
        )

        const privatePage = pages.find(
          (page) => page.importName === 'PrivatePage'
        )
        expect(privatePage).not.toBeUndefined()
        expect(privatePage.importPath).toEqual(
          importStatementPath(path.join(pagesDir, 'PrivatePage/PrivatePage'))
        )
      })
    })

    describe('resolveFile', () => {
      const p = resolveFile(path.join(FIXTURE_BASEDIR, 'web', 'src', 'Routes'))
      expect(path.extname(p)).toEqual('.tsx')

      const q = resolveFile(
        path.join(FIXTURE_BASEDIR, 'web', 'public', 'favicon')
      )
      expect(q).toBe(null)
    })

    describe('ensurePosixPath', () => {
      it('Returns unmodified input if not on Windows', () => {
        const originalPlatform = process.platform
        Object.defineProperty(process, 'platform', {
          value: 'NotWindows',
        })

        const testPath = 'X:\\some\\weird\\path'
        const posixPath = ensurePosixPath(testPath)

        Object.defineProperty(process, 'platform', {
          value: originalPlatform,
        })

        expect(posixPath).toEqual(testPath)
      })

      it('Transforms paths on Windows', () => {
        const originalPlatform = process.platform
        Object.defineProperty(process, 'platform', {
          value: 'win32',
        })

        const testPath = '..\\some\\relative\\path'
        const posixPath = ensurePosixPath(testPath)

        Object.defineProperty(process, 'platform', {
          value: originalPlatform,
        })

        expect(posixPath).toEqual('../some/relative/path')
      })

      it('Handles drive letters', () => {
        const originalPlatform = process.platform
        Object.defineProperty(process, 'platform', {
          value: 'win32',
        })

        const testPath = 'C:\\some\\full\\path\\to\\file.ext'
        const posixPath = ensurePosixPath(testPath)

        Object.defineProperty(process, 'platform', {
          value: originalPlatform,
        })

        expect(posixPath).toEqual('/c/some/full/path/to/file.ext')
      })
    })
  })
})
