export const flightcontrolConfig = {
  environments: [
    {
      id: 'development',
      name: 'Development',
      region: 'us-east-1',
      source: {
        branch: 'main',
      },
      services: [
        {
          id: 'redwood-api',
          name: 'Redwood API',
          type: 'fargate',
          cpu: 0.25,
          memory: 0.5,
          installCommand:
            'yarn set version stable && NODE_ENV=development yarn install --immutable',
          buildCommand: 'yarn rw deploy flightcontrol api',
          startCommand: 'yarn rw deploy flightcontrol api --serve',
          postBuildCommand: 'echo 0',
          port: 8911,
          healthCheckPath: '/graphql/health',
          envVariables: {},
        },
        {
          id: 'redwood-web',
          name: 'Redwood Web',
          type: 'static',
          singlePageApp: true,
          installCommand:
            'yarn set version stable && NODE_ENV=development yarn install --immutable',
          buildCommand: 'yarn rw deploy flightcontrol web',
          outputDirectory: 'web/dist',
        },
      ],
    },
  ],
}

export const postgresDatabaseService = {
  id: 'db',
  name: 'Database',
  type: 'rds',
  engine: 'postgres',
  engineVersion: '12',
  instanceSize: 'db.t2.micro',
  port: 5432,
  storage: 20,
  private: false,
}

export const mysqlDatabaseService = {
  id: 'db',
  name: 'Mysql',
  type: 'rds',
  engine: 'mysql',
  engineVersion: '8',
  instanceSize: 'db.t2.micro',
  port: 3306,
  storage: 20,
  private: false,
}

export const databaseEnvVariables = {
  DATABASE_URL: {
    fromService: { id: 'db', value: 'dbConnectionString' },
  },
}
