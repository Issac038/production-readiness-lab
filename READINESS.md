# Readiness Evidence Pack

**Branch:** `feat/readiness-signoff`  
**Validation date:** 2026-09-12  
**Scope:** local Docker Compose release of the Node.js service, Prometheus, and
Grafana.

This pack records observed evidence. It does not treat configuration or source
inspection as a substitute for a live deployment check.

## 1. Deployment evidence

### CI

The repository CI workflow runs on every branch push and pull request. It
installs Node.js 20 dependencies, runs lint and tests, and builds the Docker
image:

- Workflow: [.github/workflows/ci.yml](./.github/workflows/ci.yml)
- Required checks: `npm run lint`, `npm test`, and `docker build`
- Branch under review: `feat/readiness-signoff`
- CI result: **pending until this branch push is processed**

The passing run URL and commit SHA will be added after the branch push triggers
the workflow. A green CI result is required before sign-off.

### Compose health

The requested live check was attempted with:

```text
$ docker compose up -d
unable to get image 'prom/prometheus:v2.53.0': failed to connect to the docker API
at npipe:////./pipe/dockerDesktopLinuxEngine; check if the path is correct and
if the daemon is running: open //./pipe/dockerDesktopLinuxEngine: The system
cannot find the file specified.
```

Therefore there is no honest `docker compose ps` healthy snapshot in this
environment. The healthy state remains **unproven** and is an explicit
readiness blocker, not a successful result.

### Configuration verification

`docker compose config` rendered successfully. The relevant output was:

```text
app:
  container_name: prl-app
  environment:
    APP_VERSION: 1.0.0
    PORT: "8080"
  ports:
    - target: 8080
      published: "8080"
prometheus:
  container_name: prl-prometheus
  ports:
    - target: 9090
      published: "9090"
grafana:
  container_name: prl-grafana
  ports:
    - target: 3000
      published: "3000"
```

The cross-file configuration agrees:

| Concern | App/Dockerfile | Compose | Prometheus |
| --- | --- | --- | --- |
| Application port | `PORT=8080`, `EXPOSE 8080` | `8080:8080` | `app:8080` |
| Application service name | app process | `app`, container `prl-app` | scrape target `app:8080` |
| Metrics path | `/metrics` route | app network | `metrics_path: /metrics` |
| Prometheus port | N/A | `9090:9090`, container `prl-prometheus` | self-target `localhost:9090` |
| Grafana port | N/A | `3000:3000`, container `prl-grafana` | datasource points to Prometheus |

The app health check is also consistent: Docker probes
`http://localhost:8080/health`, which is implemented by the service.

## 2. Monitoring visibility

The monitoring configuration is present and internally consistent:

- Prometheus scrapes `app:8080/metrics` every five seconds in
  [prometheus/prometheus.yml](./prometheus/prometheus.yml).
- The provisioned **Service Overview** dashboard in
  [grafana/dashboards/service-overview.json](./grafana/dashboards/service-overview.json)
  refreshes every five seconds.
- The dashboard includes request rate, error rate, p95 latency, and app-up
  panels.
- Traffic generation is provided by
  [scripts/generate-traffic.sh](./scripts/generate-traffic.sh), including
  occasional 404s so the error signal is observable.

The live proof could not be captured because Docker Desktop's Linux engine was
unavailable. Consequently, Prometheus target `app` **UP** and live Grafana
values are **not proven** in this run. A sign-off run must capture:

```text
http://localhost:9090/targets       -> app target: UP
http://localhost:3000/              -> Service Overview with live values
```

## 3. Recovery readiness

Rollback was not claimed as demonstrated. The local Docker engine failure
prevented both applying a bad release and observing recovery on `/health` and
the dashboard.

The intended, inspectable rehearsal is:

```text
# Capture the known-good image/version first.
docker compose images
curl --fail http://localhost:8080/health

# Apply the bad release in a disposable working tree or image tag.
docker compose up -d --build app
curl --fail http://localhost:8080/health

# Roll back to the last known-good commit/image.
git switch <last-known-good-commit>
docker compose up -d --build app
docker compose ps
curl --fail http://localhost:8080/health
```

The expected recovery evidence is a healthy `prl-app` container, HTTP 200 from
`/health`, and the Grafana Health panel returning to `1`. Because that sequence
was not executable here, recovery readiness is **unproven**.

## 4. Engineering decisions

| Decision | Reliability or control gained |
| --- | --- |
| Container and application health checks call `/health` | Separates a running process from a responding service and gives Compose/operators a repeatable probe. |
| Prometheus uses the Compose service DNS name `app:8080` | Avoids host-specific addressing and makes the scrape path work inside the Compose network. |
| Five-second scrape and dashboard refresh intervals | Makes traffic and recovery changes visible quickly during a release rehearsal. |
| Dashboard includes request rate, error rate, p95 latency, and health | Gives a compact golden-signal view instead of relying on application logs alone. |
| CI builds the same Dockerfile used by Compose after lint and tests | Prevents a tested source tree from diverging silently from the deployable image. |
| Compose services use restart policies and explicit image versions for dependencies | Improves restart behavior and makes monitoring dependencies reproducible. |

## Readiness Review

### Strengths

- The source-level configuration is coherent: application port, Compose
  bindings, service DNS name, metrics route, and Prometheus scrape target
  agree.
- The service has automated lint/test/image-build gates and a health endpoint
  used by Docker.
- The monitoring design covers the requested golden signals and has a traffic
  generator for repeatable demonstrations.

### Unresolved risks

- **High impact:** Docker Desktop was unavailable during this validation, so
  container health, Prometheus target `UP`, live Grafana data, and rollback
  recovery are unknown rather than proven. A release could appear configured
  correctly while failing at runtime.
- The rollback procedure is documented but has not been executed against a bad
  image in this evidence run; recovery time and dashboard behavior are
  therefore unknown.
- Grafana uses the default `admin`/`admin` credentials in local Compose. This
  is acceptable only for local demonstration and must not be promoted to a
  shared or production environment.

### Verdict

**Not ready for sign-off.** CI/configuration evidence is structured and the
monitoring design is present, but the required live health, target-UP,
dashboard, and rollback proofs could not be collected, so declaring readiness
would overstate the evidence.

## Cloud mapping note

The local flow maps to a cloud release as follows: build and push the tested
container image to **Artifact Registry**, deploy that image to **Cloud Run**
with the `/health` startup/readiness settings, and replace local Prometheus and
Grafana observation with **Cloud Monitoring** metrics, dashboards, and alerts.
This note is documentation only; no cloud resources or billing are used by
this change.
