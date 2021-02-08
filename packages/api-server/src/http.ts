import bodyParser from 'body-parser'
import type { Response, Request } from 'express'
import express from 'express'
import morgan from 'morgan'

export interface Lambdas {
  [path: string]: any
}
let LAMBDA_FUNCTIONS: Lambdas = {}
export const setLambdaFunctions = (functions: Lambdas): void => {
  LAMBDA_FUNCTIONS = functions
}

export const server = ({
  requestHandler,
}: {
  requestHandler: (req: Request, res: Response, lambdaFunction: any) => void
}): any => {
  const app = express()
  app.use(
    bodyParser.text({
      type: ['text/*', 'application/json', 'multipart/form-data'],
    })
  )
  app.use(
    bodyParser.raw({
      type: '*/*',
      limit: process.env.BODY_PARSER_LIMIT,
    })
  )
  app.use(morgan<Request, Response>('dev'))

  const lambdaHandler = async (req: Request, res: Response): Promise<void> => {
    const { routeName } = req.params
    const lambdaFunction = LAMBDA_FUNCTIONS[routeName]
    if (!lambdaFunction) {
      const errorMessage = `Function "${routeName}" was not found.`
      console.error(errorMessage)
      res.status(404).send(errorMessage)
      return
    }
    await requestHandler(req, res, lambdaFunction)
  }

  app.all('/:routeName', lambdaHandler)
  app.all('/:routeName/*', lambdaHandler)

  return app
}
