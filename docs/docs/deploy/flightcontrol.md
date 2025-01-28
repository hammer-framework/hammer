---
description: How to deploy a Redwood app to AWS via Flightcontrol
---

# Deploy to AWS with Flightcontrol

[Flightcontrol](https://www.flightcontrol.dev?ref=redwood) enables any developer to deploy to AWS without being a wizard. It's extremely easy to use but lets you pop the hood and leverage the raw power of AWS when needed. It supports servers, static sites, and databases which makes it a perfect fit for hosting scalable Redwood apps.

## Flightcontrol Deploy Setup

1. In your project, run the command `yarn rw setup deploy flightcontrol --database=YOUR_DB_TYPE` where YOUR_DB_TYPE is `mysql` or `postgresql`
2. NOTE: The RedwoodJS Flightcontrol sets up an array of environments and defaults you to the 1st one: 'Development', add to the array to deploy more environments.
3. Commit the changes and push to github.
4. If you don't have an account, sign up at [app.flightcontrol.dev/signup](https://app.flightcontrol.dev/signup?ref=redwood).
5. Create a new project from the onboarding screen or project list.
    1. Connect your Github account and select your repo.
    2. Click "Create Project" and complete any required steps like linking your AWS account.
    3. Configuration Type should autoselect as `flightcontrol.json`.
    4. NOTE: `flightcontrol.json` is now the source of truth for your Project and its Environments.
6. Add your env vars in Flightcontrol for your Environment.
7. If using dbAuth, add the session secret key env variable in the Flightcontrol dashboard.
8. To tear down your project w/Flight control go to your dashboard and the 'Danger Zone' and choose delete.

If you have *any* problems or questions, Flightcontrol is very responsive in [their support Discord](https://discord.gg/yY8rSPrD6q).

This was a working `flightcontrol.json` configuration

```
{
  "$schema": "https://app.flightcontrol.dev/schema.json",
  "environments": [
    {
      "id": "staging",
      "name": "Staging",
      "region": "us-east-1",
      "source": {
        "branch": "staging"
      },
      "services": [
        {
          "id": "redwood-api",
          "name": "Redwood API",
          "type": "fargate",
          "buildType": "nixpacks",
          "cpu": 0.5,
          "memory": 1,
          "installCommand": "corepack enable && yarn install",
          "buildCommand": "yarn rw deploy flightcontrol api",
          "startCommand": "yarn rw deploy flightcontrol api --serve",
          "port": 8911,
          "healthCheckPath": "/graphql/health",
          "envVariables": {
            "REDWOOD_WEB_URL": {
              "fromService": {
                "id": "redwood-web",
                "value": "origin"
              }
            },
            "DATABASE_URL": {
              "fromService": {
                "id": "db",
                "value": "dbConnectionString"
              }
            }
          }
        },
        {
          "id": "redwood-web",
          "name": "Redwood Web",
          "type": "static",
          "buildType": "nixpacks",
          "singlePageApp": true,
          "installCommand": "corepack enable && yarn install",
          "buildCommand": "yarn rw deploy flightcontrol web",
          "outputDirectory": "web/dist",
          "envVariables": {
            "REDWOOD_API_URL": {
              "fromService": {
                "id": "redwood-api",
                "value": "origin"
              }
            }
          }
        },
        {
          "id": "db",
          "name": "Database",
          "type": "rds",
          "engine": "postgres",
          "engineVersion": "12",
          "instanceSize": "db.t4g.micro",
          "port": 5432,
          "storage": 20,
          "private": false
        }
      ]
    }
  ]
}
```
