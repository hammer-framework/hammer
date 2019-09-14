#!/usr/bin/env node
// types
import { Response, Request } from 'express'
import { APIGatewayProxyResult, APIGatewayProxyEvent } from 'aws-lambda'

/**
 * The hammer-dev-server is a command line argument that does 3 things:
 *
 * 1. Reads the hammer config file and sets the default path for finding the
 * lambda functions and the port
 * 2. Maps the lambda functions to a path and serves them via http
 * 3. Emulates a "AWS Lambda Function Handler":
 *  https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-handler.html
 */

import path from 'path'
import { getHammerConfig } from '@hammerframework/hammer-core'
import express from 'express'
// @ts-ignore
import expressLogging from 'express-logging'
import bodyParser from 'body-parser'
import qs from 'qs'
import args from 'args'
import requireDir from 'require-dir'
import chokidar from 'chokidar'
// @ts-ignore
import clear from 'clear'
// @ts-ignore
import babelRegister from '@babel/register'

const hammerConfig = getHammerConfig()
const hammerApiDir = path.join(hammerConfig.baseDir, 'api')

babelRegister({
  extends: path.join(hammerApiDir, '.babelrc.js'),
  only: [hammerApiDir],
  ignore: ['node_modules'],
})

// TODO: Convert to yargs.
args
  .option('port', '', hammerConfig.api.port)
  .option(
    'path',
    'The path to your lambda functions',
    hammerConfig.api.paths.functions
  )
const { port: PORT, path: PATH } = args.parse(process.argv)
const HOSTNAME = `http://localhost:${PORT}`

const showHeader = (lambdas: Object) => {
  console.log(`\n⚒ HammerFramework's API Development Server\n`)
  console.log(`◌ Listening on ${HOSTNAME}`)
  console.log(`◌ Watching ${hammerApiDir}`)
  console.log('\nNow serving\n')
  console.log(
    Object.keys(lambdas)
      .map((routeName) => `► ${HOSTNAME}/${routeName}/`)
      .join('\n')
  )
}

// These removes everything in the cache. It's a bit extreme, but we
// can always refine the mechanism here.
const purgeRequireCache = () => {
  Object.keys(require.cache).forEach((cacheKey) => {
    delete require.cache[cacheKey]
  })
}

const requireLambdaFunctions = (path: string) =>
  requireDir(path, { recurse: false })

const app = express()

app.use(
  bodyParser.text({
    type: ['text/*', 'application/json', 'multipart/form-data'],
  })
)
app.use(bodyParser.raw({ type: '*/*' }))
app.use(expressLogging(console))

// Find all the lambda functions that we should serve
let lambdaFunctions = requireLambdaFunctions(PATH)

app.all('/', (_, res) => {
  return res.send(`
    <p>The following functions are available:</p>
    ${Object.keys(lambdaFunctions)
      .map((routeName) => `- <a href="/${routeName}">/${routeName}</a>`)
      .join('<br />')}
  `)
})

const parseBody = (rawBody: string | Buffer) => {
  if (typeof rawBody === 'string') {
    return { body: rawBody, isBase64Encoded: false }
  }
  if (rawBody instanceof Buffer) {
    return { body: rawBody.toString('base64'), isBase64Encoded: true }
  }
  return { body: '', isBase64Encoded: false }
}

const lambdaEventForExpressRequest = (
  request: Request
): APIGatewayProxyEvent => {
  return {
    httpMethod: request.method,
    headers: request.headers,
    path: request.path,
    queryStringParameters: qs.parse(request.url.split(/\?(.+)/)[1]),
    ...parseBody(request.body), // adds `body` and `isBase64Encoded`
  } as APIGatewayProxyEvent
}

const expressResponseForLambdaResult = (
  expressResFn: Response,
  lambdaResult: APIGatewayProxyResult
) => {
  // The response object must be compatible with JSON.stringify according
  // to the aws lambda docs, but the type definition specifies that it has
  // to be a string. Let's double check this.
  const { statusCode = 200, headers, body = '' } = lambdaResult
  if (headers) {
    Object.keys(headers).forEach((headerName) => {
      const headerValue: any = headers[headerName]
      expressResFn.setHeader(headerName, headerValue)
    })
  }
  expressResFn.statusCode = statusCode
  return expressResFn.end(
    typeof body === 'string' ? body : JSON.stringify(body)
  )
}

const expressResponseForLambdaError = (
  expressResFn: Response,
  error: Error
) => {
  console.error(error)
  expressResFn.status(500).send(error)
}

app.all('/:routeName', async (req, res) => {
  const { routeName } = req.params

  const lambdaFunction = lambdaFunctions[routeName]
  if (!lambdaFunction) {
    const errorMessage = `route "${routeName}" not found`
    console.error(errorMessage)
    return res.status(404).send(errorMessage)
  }

  const { handler } = lambdaFunction

  if (typeof handler !== 'function') {
    const errorMessage = `"${routeName}" does not export a function named "handler"`
    console.error(errorMessage)
    return res.status(500).send(errorMessage)
  }

  // We take the express request object and convert it into a lambda function event.

  const event = lambdaEventForExpressRequest(req)

  const handlerCallback = (expressResFn: Response) => (
    error: Error,
    lambdaResult: APIGatewayProxyResult
  ) => {
    if (error) {
      return expressResponseForLambdaError(expressResFn, error)
    }
    return expressResponseForLambdaResult(expressResFn, lambdaResult)
  }

  // https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-handler.html
  // Execute the lambda function.
  const handlerPromise = handler(
    event,
    {}, // TODO: Add support for context: https://github.com/DefinitelyTyped/DefinitelyTyped/blob/0bb210867d16170c4a08d9ce5d132817651a0f80/types/aws-lambda/index.d.ts#L443-L467
    handlerCallback(res)
  )

  // In this case the handlerCallback should not be called.
  if (handlerPromise && typeof handlerPromise.then === 'function') {
    try {
      const lambaResponse = await handlerPromise
      return expressResponseForLambdaResult(res, lambaResponse)
    } catch (error) {
      return expressResponseForLambdaError(res, error)
    }
  }
})

const reloadLambdas = (path: string) => {
  console.log('\nReloading...\n')
  purgeRequireCache()
  lambdaFunctions = requireLambdaFunctions(PATH)
  clear()
  showHeader(lambdaFunctions)
}

const startServer = () => app.listen(PORT, () => showHeader(lambdaFunctions))
const server = startServer()
server.setTimeout(10 * 1000)

const watcher = chokidar.watch(hammerApiDir, {
  ignored: (path: string) => path.includes('node_modules'),
})

watcher.on('ready', () => {
  watcher.on('add', reloadLambdas)
  watcher.on('change', reloadLambdas)
  watcher.on('unlink', reloadLambdas)
})
