import { URL_file } from 'src/x/URL'
import { FileNode } from '../ide'
import { RWProject } from '../model'
import { Icon, OutlineItem } from './types'

/*
- all items have icons. in vscode you can create items without icons but
  they introduce layout consistency issues.
*/

export function getOutline(project: RWProject): OutlineItem {
  return {
    label: 'Redwood.js',
    icon: Icon.redwood,
    expanded: false,
    async children() {
      return [
        {
          label: 'pages',
          icon: Icon.pages,
          onAdd: 'rw g page',
          expaded: true,
          link: URL_file(project.pathHelper.web.pages),
          async children() {
            return fromFiles(project.pages)
          },
        },
        {
          label: 'Routes.js',
          link: project.router.uri,
          icon: Icon.pages,
          onAdd: 'rw g page',
          async children() {
            return project.router.routes.map((route) => {
              return {
                id: route.id,
                label: route.outlineLabel,
                description: route.outlineDescription,
                link: route.outlineLink,
                icon: route.isAuthenticated ? Icon.page : Icon.page,
              }
            })
          },
        },
        {
          label: 'components',
          onAdd: 'rw g component',
          icon: Icon.components,
          link: URL_file(project.pathHelper.web.components),
          async children() {
            return fromFiles(project.components)
          },
        },
        {
          label: 'layouts',
          onAdd: 'rw g layout',
          icon: Icon.layouts,
          link: URL_file(project.pathHelper.web.layouts),
          async children() {
            return fromFiles(project.layouts)
          },
        },
        {
          label: 'cells',
          onAdd: 'rw g cell',
          link: URL_file(project.pathHelper.web.components),
          async children() {
            return fromFiles(project.cells)
          },
        },
        {
          label: 'services',
          onAdd: 'rw g service',
          link: URL_file(project.pathHelper.api.services),
          async children() {
            return fromFiles(project.services)
          },
        },
        {
          label: 'functions',
          onAdd: 'rw g function',
          icon: Icon.functions,
          link: URL_file(project.pathHelper.api.functions),
          async children() {
            return fromFiles(project.functions)
          },
        },
        {
          label: 'schema.prisma',
          icon: Icon.prisma,
          link: URL_file(project.pathHelper.api.dbSchema),
          async children() {
            const dmmf = await project.prismaDMMF()
            return dmmf.datamodel.models.map((model) => {
              return {
                label: model.name,
                async children() {
                  const fields = model.fields.map((f) => {
                    return { label: f.name, description: `:${f.type}` }
                  })
                  const actions: OutlineItem[] = [
                    {
                      label: 'generate sdl',
                      icon: Icon.rw_cli,
                      description:
                        'create graphql interface to access this model',
                      link: `rw g sdl ${model.name}`,
                    },
                    {
                      label: 'generate scaffold',
                      icon: Icon.rw_cli,
                      description:
                        'generate pages, SDL, and a services object for this model',
                      link: `rw g scaffold ${model.name}`,
                    },
                  ]
                  return [...fields, ...actions]
                },
              }
            })
          },
        },
      ]
    },
  }
}

function fromFiles(fileNodes: FileNode[]): OutlineItem[] {
  return fileNodes.map(fromFile)
}

function fromFile(fileNode: FileNode): OutlineItem {
  return {
    key: fileNode.id,
    label: fileNode.basenameNoExt,
    link: fileNode.uri,
  }
}

/**
 * this is used for
 * @param uri
 * @param root
 */
export async function findOutlineItemForFile(
  uri: string,
  root: OutlineItem
): Promise<OutlineItem | undefined> {
  if (root.link === uri) return root
  // bail out early on branches are not potential parents
  if (root.link) if (!uri.startsWith(root.link)) return undefined
  const children = root.children ? await root.children() : []
  for (const c of children) {
    const ff = await findOutlineItemForFile(uri, c)
    if (ff) return ff
  }
}
