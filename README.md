# production-readiness-lab

A small Node.js + Express service that ships through CI, runs in containers, and is
monitored with Prometheus and Grafana. Everything runs locally with Docker Compose.

## Requirements

- Docker + Docker Compose
- (Optional, for running the app outside Docker) Node.js 20+

## Setup

```bash
git clone https://github.com/kalviumcommunity/production-readiness-lab.git
cd production-readiness-lab
docker compose up -d
```

Check what is running:

```bash
docker compose ps
docker compose logs -f app
```

Stop everything:

```bash
docker compose down
```

## Endpoints

The service listens on port `8080`.

| Method | Path       | Description                          |
|--------|------------|--------------------------------------|
| GET    | `/`        | Service info                         |
| GET    | `/health`  | Health status and uptime             |
| GET    | `/metrics` | Prometheus metrics                   |

```bash
curl localhost:8080/
curl localhost:8080/health
curl localhost:8080/metrics
```

## Generating traffic

Send a batch of requests so the dashboards show live data:

```bash
./scripts/generate-traffic.sh          # 500 requests to localhost:8080
./scripts/generate-traffic.sh 1000     # custom request count
```

## Prometheus

Open <http://localhost:9090>.

- Targets: <http://localhost:9090/targets>
- Try a query: `sum(rate(http_requests_total[1m]))`

## Grafana

Open <http://localhost:3000>.

- Username: `admin`
- Password: `admin`

The **Service Overview** dashboard is provisioned automatically and shows Request Rate,
Error Rate, Latency, and Health.

## Running the app locally (without Docker)

```bash
cd app
npm install
npm test
npm start
```
