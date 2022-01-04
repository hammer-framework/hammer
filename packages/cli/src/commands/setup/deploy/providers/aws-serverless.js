import fs from 'fs'
import path from 'path'

import { getPaths } from '../../../../lib'

const SERVERLESS_YML = `# See the full yml reference at https://www.serverless.com/framework/docs/providers/aws/guide/serverless.yml/
service: app

# Uncomment org and app if you want to integrate your deployment with the Serverless dashboard. See https://www.serverless.com/framework/docs/dashboard/ for more details.
# org: your-org
# app: your-app

plugins:
  - serverless-dotenv-plugin

custom:
  dotenv:
    include:
      - # List the environment variables you want to include from your .env file here.

provider:
  name: aws
  runtime: nodejs14.x
  region: us-east-2 # This is the AWS region where the service will be deployed.
  httpApi: # HTTP API is used by default. To learn about the available options in API Gateway, see https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-vs-rest.html
    cors:
      allowedOrigins:
        - '*' # This is the default value. You can remove this line if you want to restrict the CORS to a specific origin.
      # allowCredentials: true # allowCrednetials should only be used when allowedOrigins doesn't include '*'
      allowedHeaders:
        - authorization
        - auth-provider
        - content-Type
        - X-Amz-Date
        - X-Api-Key
        - X-Amz-Security-Token
        - X-Amz-User-Agent
    payload: '1.0'
    useProviderTags: true # https://www.serverless.com/framework/docs/deprecations/#AWS_HTTP_API_USE_PROVIDER_TAGS
  stackTags: # Add CloudFormation stack tags here
    source: serverless
    name: Redwood Lambda API with HTTP API Gateway
  tags: # Add service wide tags here
    name: Redwood Lambda API with HTTP API Gateway
  lambdaHashingVersion: 20201221 # https://www.serverless.com/framework/docs/deprecations/#LAMBDA_HASHING_VERSION_V2

package:
  individually: true
  patterns:
    - '!node_modules/.prisma/client/libquery_engine-*'
    - 'node_modules/.prisma/client/libquery_engine-rhel-*'
    - '!node_modules/prisma/libquery_engine-*'
    - '!node_modules/@prisma/engines/**'

${
  fs.existsSync(path.resolve(getPaths().api.functions))
    ? `functions:
  ${fs
    .readdirSync(path.resolve(getPaths().api.functions))
    .map((file) => {
      const basename = path.parse(file).name
      return `${basename}:
    description: ${basename} function deployed on AWS Lambda
    package:
      artifact: api/dist/zipball/${basename}.zip # This is the default location of the zip file generated during the deploy command.
    memorySize: 1024 # mb
    timeout: 25 # seconds (max: 29)
    tags: # Tags for this specific lambda function
      endpoint: /${basename}
    # Uncomment this section to add environment variables either from the Serverless dotenv plugin or using Serverless params
    # environment:
    #   YOUR_FIRST_ENV_VARIABLE: \${env:YOUR_FIRST_ENV_VARIABLE}
    handler: ${basename}.handler
    events:
      - httpApi:
          path: /${basename}
          method: GET
      - httpApi:
          path: /${basename}
          method: POST
`
    })
    .join('  ')}`
    : ''
}
`

export const preRequisites = [
  {
    title: 'Checking if the Serverless framework is installed...',
    command: ['serverless', ['--version']],
    errorMessage: [
      'Looks like Serverless is not installed.',
      'Please follow the steps at https://www.serverless.com/framework/docs/providers/aws/guide/installation/ to install Serverless.',
    ],
  },
]

export const apiDevPackages = [
  '@vercel/nft',
  'archiver',
  'fs-extra',
  'serverless-dotenv-plugin',
]

export const files = [
  {
    path: path.join(getPaths().base, 'serverless.yml'),
    content: SERVERLESS_YML,
  },
]

export const gitIgnoreAdditions = ['.serverless']

export const prismaBinaryTargetAdditions = () => {
  const content = fs.readFileSync(getPaths().api.dbSchema).toString()

  if (!content.includes('rhel-openssl-1.0.x')) {
    const result = content.replace(
      /binaryTargets =.*\n/,
      `binaryTargets = ["native", "rhel-openssl-1.0.x"]\n`
    )

    fs.writeFileSync(getPaths().api.dbSchema, result)
  }
}

// any notes to print out when the job is done
export const notes = [
  'You are ready to deploy to AWS using the Serverless framework!',
  'To configure AWS credentials, see https://www.serverless.com/framework/docs/providers/aws/guide/credentials/',
  'For a more detailed way to configure the credentials using the AWS CLI, see https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html',
  'To deploy, see https://redwoodjs.com/docs/deploy#aws_serverless',
]
