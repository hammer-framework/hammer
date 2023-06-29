import { ESLintUtils } from '@typescript-eslint/utils'

const createRule = ESLintUtils.RuleCreator.withoutDocs

function isAllowedElement(name: string) {
  const allowedElements = ['Router', 'Route', 'Set', 'Private']
  return allowedElements.includes(name)
}

export const unsupportedRouteComponents = createRule({
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Find unsupported route components',
      recommended: 'warn',
    },
    messages: {
      unexpected:
        'Unexpected JSX element <{{name}}>. Only <Router>, <Route>, <Set> and <Private> are allowed in Router files.',
    },
    schema: [], // No additional configuration needed
  },
  defaultOptions: [],
  create(context) {
    if (!/\bweb\/src\/Routes\.(tsx|jsx|js)$/.test(context.getFilename())) {
      return {}
    }

    return {
      JSXOpeningElement: function (node) {
        let name = ''

        if (node.name.type === 'JSXIdentifier') {
          name = node.name.name
        } else {
          return
        }

        if (!isAllowedElement(name)) {
          context.report({
            node,
            messageId: 'unexpected',
            data: { name },
          })
        }
      },
    }
  },
})
