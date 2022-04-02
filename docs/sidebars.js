module.exports = {
  main: [
    {
      type: 'category',
      label: 'Reference',
      link: {
        type: 'generated-index',
        title: 'Reference',
        // description: '',
        slug: '/index',
      },
      className: 'docs-sidebar-category',
      items: [
        'quick-start',
        'a11y',
        'app-configuration-redwood-toml',
        'assets-and-files',
        'authentication',
        'builds',
        'cells',
        'cli-commands',
        'connection-pooling',
        'contributing-overview',
        'contributing-walkthrough',
        'cors',
        'custom-web-index',
        'data-migrations',
        {
          Deployment: [
            { type: 'doc', label: 'Introduction', id: 'deploy/introduction' },
            { type: 'doc', label: 'Baremetal', id: 'deploy/baremetal' },
            { type: 'doc', label: 'Flightcontrol', id: 'deploy/flightcontrol' },
            { type: 'doc', label: 'Netlify', id: 'deploy/netlify' },
            { type: 'doc', label: 'Render', id: 'deploy/render' },
            { type: 'doc', label: 'Serverless Framework', id: 'deploy/serverless' },
            { type: 'doc', label: 'Vercel', id: 'deploy/vercel' },
          ],
        },
        'directives',
        'environment-variables',
        'forms',
        'graphql',
        'local-postgres-setup',
        'logger',
        'mocking-graphql-requests',
        'prerender',
        'project-configuration-dev-test-build',
        'redwoodrecord',
        'router',
        'schema-relations',
        'security',
        'seo-head',
        'serverless-functions',
        'services',
        'storybook',
        'testing',
        'toast-notifications',
        'typescript',
        'webhooks',
        'webpack-configuration',
      ],
    },
    {
      type: 'category',
      label: 'Tutorial',
      className: 'tutorials-sidebar-category',
      items: [
        { type: 'doc', label: 'Foreword', id: 'tutorial/foreword' },
        {
          'Chapter 1': [
            'tutorial/chapter1/prerequisites',
            'tutorial/chapter1/installation',
            'tutorial/chapter1/file-structure',
            'tutorial/chapter1/first-page',
            'tutorial/chapter1/second-page',
            'tutorial/chapter1/layouts',
          ],
        },
        {
          'Chapter 2': [
            'tutorial/chapter2/getting-dynamic',
            'tutorial/chapter2/cells',
            'tutorial/chapter2/side-quest',
            'tutorial/chapter2/routing-params',
          ],
        },
        {
          'Chapter 3': [
            'tutorial/chapter3/forms',
            'tutorial/chapter3/saving-data',
          ],
        },
        {
          'Chapter 4': [
            'tutorial/chapter4/authentication',
            'tutorial/chapter4/deployment',
          ],
        },
        'tutorial/intermission',
        {
          'Chapter 5': [
            'tutorial/chapter5/storybook',
            'tutorial/chapter5/first-story',
            'tutorial/chapter5/testing',
            'tutorial/chapter5/first-test',
          ],
        },
        {
          'Chapter 6': [
            'tutorial/chapter6/the-redwood-way',
            'tutorial/chapter6/multiple-comments',
            'tutorial/chapter6/comments-schema',
            'tutorial/chapter6/comment-form',
          ],
        },
        {
          'Chapter 7': ['tutorial/chapter7/rbac'],
        },
        'tutorial/afterword',
      ],
    },
    {
      type: 'category',
      label: 'Cookbook',
      link: {
        type: 'generated-index',
        title: 'Cookbook',
        // description: '',
        slug: '/cookbook/index',
      },
      className: 'cookbook-sidebar-category',
      items: [
        {
          type: 'autogenerated',
          dirName: 'cookbook',
        },
      ],
    },
  ],
}
