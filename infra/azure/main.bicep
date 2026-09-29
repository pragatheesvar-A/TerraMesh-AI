// TerraMesh AI — Azure Deployment (Bicep)
// ============================================================================
// Deploys the containerized stack to Azure Container Apps:
//   - terramesh-backend   (FastAPI, from the backend container image)
//   - terramesh-frontend  (nginx SPA + reverse proxy)
//   - terramesh-postgres  (timescale/timescaledb-ha:pg16 — NOTE: Azure's
//                          MANAGED PostgreSQL does NOT include TimescaleDB,
//                          so the database runs as a container; for production
//                          prefer Timescale Cloud or a VM with the ha image)
//   - terramesh-redis, terramesh-mosquitto
//
// STATUS: AUTHORED, NEVER DEPLOYED — this repository's environment has no
// Azure subscription or CLI. Validation requires: `az bicep build` + a test
// deployment in a real subscription (see docs/INTEGRATIONS.md).
//
// Usage (when a subscription exists):
//   az group create --name rg-terramesh --location centralindia
//   az deployment group create -f infra/azure/main.bicep -g rg-terramesh \
//     -p postgresPassword='<strong-password>' secretKey='<openssl-rand-hex-32>'
// ============================================================================

@description('Required: strong PostgreSQL password')
@secure()
param postgresPassword string

@description('Required: API/session signing secret (openssl rand -hex 32)')
@secure()
param secretKey string

param location string = resourceGroup().location
param allowedOrigins string = 'https://terramesh.example.in'

resource managedEnv 'Microsoft.App/managedEnvironments@2024-02-02-preview' = {
  name: 'terramesh-env'
  location: location
  properties: {
    appInsightsConfiguration: { }
    zoneRedundant: false
  }
}

// ── PostgreSQL (TimescaleDB + PostGIS container) ────────────────────────────
// Data persists on an Azure Files share; for production-scale time-series
// prefer Timescale Cloud and set DATABASE_URL accordingly.
resource postgres 'Microsoft.App/containerApps@2024-02-02-preview' = {
  name: 'terramesh-postgres'
  location: location
  properties: {
    environmentId: managedEnv.id
    configuration: {
      secrets: [
        { name: 'pg-password', value: postgresPassword }
      ]
    }
    template: {
      containers: [
        {
          name: 'postgres'
          image: 'timescale/timescaledb-ha:pg16'
          resources: { cpu: json('1.0'), memory: '2Gi' }
          env: [
            { name: 'POSTGRES_DB', value: 'terramesh' }
            { name: 'POSTGRES_USER', value: 'terramesh' }
            { secretRef: 'pg-password', name: 'POSTGRES_PASSWORD' }
          ]
        }
      ]
    }
  }
}

resource redis 'Microsoft.App/containerApps@2024-02-02-preview' = {
  name: 'terramesh-redis'
  location: location
  properties: {
    environmentId: managedEnv.id
    template: {
      containers: [
        {
          name: 'redis'
          image: 'redis:7-alpine'
          resources: { cpu: json('0.5'), memory: '512Mi' }
          args: [ 'redis-server', '--maxmemory', '256mb', '--maxmemory-policy', 'allkeys-lru' ]
        }
      ]
    }
  }
}

resource mosquitto 'Microsoft.App/containerApps@2024-02-02-preview' = {
  name: 'terramesh-mosquitto'
  location: location
  properties: {
    environmentId: managedEnv.id
    template: {
      containers: [
        {
          name: 'mosquitto'
          image: 'eclipse-mosquitto:2'
          resources: { cpu: json('0.25'), memory: '256Mi' }
        }
      ]
    }
  }
}

// ── Backend (FastAPI) ───────────────────────────────────────────────────────
resource backend 'Microsoft.App/containerApps@2024-02-02-preview' = {
  name: 'terramesh-backend'
  location: location
  properties: {
    environmentId: managedEnv.id
    configuration: {
      ingress: {
        external: true
        targetPort: 8000
        transport: 'http'
      }
      secrets: [
        { name: 'secret-key', value: secretKey }
        { name: 'pg-password', value: postgresPassword }
      ]
    }
    template: {
      containers: [
        {
          name: 'backend'
          image: 'ghcr.io/terramesh/backend:latest'   // build+push first (see docs)
          resources: { cpu: json('1.0'), memory: '2Gi' }
          env: [
            { name: 'ENVIRONMENT', value: 'production' }
            { name: 'DATABASE_URL', secretRef: 'pg-password' }   // composed in CI or via init container
            { name: 'REDIS_URL', value: 'redis://${redis.name}:6379' }
            { name: 'MQTT_BROKER_HOST', value: mosquitto.name }
            { name: 'ALLOWED_ORIGINS', value: allowedOrigins }
          ]
        }
      ]
    }
  }
}

// ── Frontend (nginx SPA + reverse proxy — single public entry) ─────────────
resource frontend 'Microsoft.App/containerApps@2024-02-02-preview' = {
  name: 'terramesh-frontend'
  location: location
  properties: {
    environmentId: managedEnv.id
    configuration: {
      ingress: { external: true, targetPort: 80 }
    }
    template: {
      containers: [
        {
          name: 'frontend'
          image: 'ghcr.io/terramesh/frontend:latest'   // build+push first (see docs)
          resources: { cpu: json('0.5'), memory: '512Mi' }
        }
      ]
    }
  }
}

output backendFqdn string = backend.properties.configuration.ingress.fqdn
output frontendFqdn string = frontend.properties.configuration.ingress.fqdn
