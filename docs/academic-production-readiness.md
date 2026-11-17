# Komitehane academic rollout — production readiness and evidence

**Scope:** PR #5, isolated academic database. Real university data publication is intentionally deferred. This checklist does not authorize a production migration, service restart, bucket change, or PR merge.

## What GitHub Actions does verify

The `.github/workflows/academic-test.yml` matrix uses disposable PostgreSQL **16 and 18** services. Each job runs the academic and existing Node test suites, lint, Drizzle migration checks, clean/repeated migrations, fixture seed idempotency, unique/FK/check constraints, concurrent publication and published-content immutability, browser smoke, two builds, SEO audit, TLS validation, and view-only runtime-role access.

The PostgreSQL 18 matrix job additionally creates a **custom-format pg_dump (-Fc)** and restores it using **pg_restore** into a **different temporary database**; it asserts eight academic base tables and restored published/superseded versions. This is evidence of the test fixture only, not a restore of live user data or the live Dokploy instance. Results must be checked on the current commit before declaring the gate passed.

## What remains a VPS / account-owner gate (do not mark passed based on CI)

1. **Read-only inventory:** On the Oracle VPS, inspect the exact running Swarm services, Docker published ports, and Traefik router config. The expected application and blog DB services from the operations handoff are `komitehane-frontend-5plyok` and `komitehane-dbblog-hbcbpm`; confirm actual names before acting. In particular verify port 3000 is not publicly published, direct PostgreSQL TCP/15432 exposure is restricted, and the existing live site/build still work. OCI ingress and NSG exposure must be checked in the Oracle console; `ss` or Docker output alone does not prove cloud firewall policy.
2. **Trusted forwarding and edge rate limit:** Check Dokploy Applications → application → Advanced → Traefik File System for the live router configuration. Preserve generated HTTPS, services and routing. Restrict the origin and ensure `forwardedHeaders.insecure=true` is not enabled. Configure a rate-limit middleware for `PathPrefix('/api/v1/')` on the **existing service**, preferably with an API-specific higher-priority router; clone the already-generated `entryPoints`, `service` and TLS settings, and never replace the whole file blindly. Initially test against an isolated preview to avoid throttling unrelated site requests. An example middleware is below, **not a deployable standalone router**:
   
   ```yaml
   http:
     middlewares:
       komitehane-academic-api-limit:
         rateLimit:
           average: 2
           period: 1s
           burst: 20
   ```

   The defaults group by the proxy-visible remote address. Behind Cloudflare or multiple proxies, choose a verified trusted IP strategy appropriate to the actual chain; do not blindly trust user-supplied `X-Forwarded-For`. The in-process Next.js limiter remains best effort only. Reference: https://docs.dokploy.com/docs/core/guides/production-hardening and https://doc.traefik.io/traefik/reference/routing-configuration/http/middlewares/ratelimit/.
3. **Database isolation / permissions:** The academic DB name is exactly `komitehane_academic` and **must not** equal the live blog/Payload DB. Provision `academic_migrator`, `academic_writer`, `academic_app` with separate credentials, verify TLS chain/hostname, role grants, and negative tests (app role cannot SELECT base tables, cannot INSERT/UPDATE, but can SELECT approved views). Follow `docs/academic-db-operations.md`. Verify database name with `SELECT current_database();` before any command. Production migration needs explicit operator authorization. Never run the academic fixture seed on the live blog database.
4. **Live backups:** The earlier operations handoff documented a successful manual custom-format PostgreSQL 18 dump/restore (20 blog tables), a successful Oracle Object Storage manual backup/restore, a successful R2 media snapshot check, and a manual Dokploy system backup. These are **historical evidence**, not confirmation that scheduled backups are now running. Verify the **first actual scheduled** database/Dokploy backup in their respective Dokploy tabs (expected cron `0 0 * * *`, retention target 14), and the media `komitehane-media-backup.timer` execution after its scheduled 03:30 Turkey-time interval. Verify new object timestamps, accessible private buckets, destination quotas, and retention behavior; do not delete old snapshots just to force a test. Restore a new copy to a disposable non-networked instance; do not restore onto production.
5. **Rollback readiness:** Store off-VPS configuration and DB backups separately. Confirm `ACADEMIC_FEATURE_ENABLED=false` disables academic DB access while generic manual calculations still work. Never use destructive down migrations as rollback. Test backup retrieval and checksum before toggling the live feature flag.
6. **Legacy Vercel checks:** GitHub's `Vercel` status currently reports failure due to a blocked deployment/account connection, not because the academic CI fails. If Dokploy is the only deployment target, use Vercel project **Settings → Git → Disconnect** after verifying that no domains, sites, or other workflows still need Vercel. Also inspect GitHub branch protection/rulesets and remove a mandatory `Vercel` status requirement only if it is obsolete. This account-level change cannot be enacted by changing application code. Reference: https://vercel.com/docs/project-configuration/git-settings.

## Operator-supplied live inspection evidence (18 November 2026)

- Docker Swarm on `free-oracle-vps` is active; `komitehane-frontend-5plyok`, `komitehane-dbblog-hbcbpm`, and `dokploy` were reported as 1/1; `https://komitehane.com/tr` returned HTTP 200.
- The frontend Swarm service has no published container port. The existing **blog** PostgreSQL Swarm service publishes TCP 15432 on both IPv4/IPv6 wildcard listeners. UFW allows 22/80/443, but this does **not** independently firewall Docker-published ports.
- Oracle VNIC reports public IP `89.168.80.25` and **no attached NSG**. The shown Security List allows TCP 15432 only from `89.168.80.25/32` (the VPS's own public IP), with 22/80/443 unrestricted. Another Security List could still be attached to the subnet; confirm all lists and external reachability before concluding TCP 15432 is inaccessible externally.
- DNS is **Cloudflare DNS Only**, not proxied. The operator supplied a Dokploy dynamic Traefik configuration routing HTTPS to `komitehane-frontend-5plyok:3000` via Let's Encrypt and subsequently observed **33 HTTP 404 + 17 HTTP 429** from 50 concurrent requests to `/api/v1/universities?limit=1`. This is live evidence of the API-specific edge rate-limiting path functioning, not proof that forwarded-header trust, client isolation, or spoof resistance is correct. API 404 is expected before deploying PR #5.
- The media-backup timer was reported active with empty `LastTriggerUSec` and scheduled next trigger on 18 November 2026 at 03:30 Turkey time. **The actual scheduled run and resulting backup object remain unverified.**
- These observations are operator-provided terminal and dashboard outputs, **not** direct shell or Oracle API verification by this assistant. No live firewall, Traefik, database, deployment or backup settings were changed using GitHub tools.

### Further operator evidence: backup service and PostgreSQL version (18 November 2026)

- The live `komitehane-dbblog-hbcbpm` Docker service image was reported as `postgres:18` and replicas remained `1/1`. This confirms the configured image tag; inspect the running engine with `SELECT version()` before claiming a particular patch release.
- Operator supplied `journalctl` logs for `komitehane-media-backup.service` showing a **successful service execution at 01:12:40–01:12:49 +03** with snapshot ID `20261117T221240Z`; remote comparison returned **0 differences and 139 matching files**, total **15.715 MiB (16,478,046 bytes)**, followed by `BACKUP VERIFIED`.
- Media retention scan reported `Retention: 14 days`, `Mode: --apply`, kept three recent snapshot IDs and completed. This proves a scan was executed, **not** that aged-snapshot expiration has been independently tested.
- The systemd timer was active but `LastTriggerUSec=` empty in the supplied output, with next listed trigger **18 November 2026 at 03:30 +03**. Thus the verified service run **must not be misrepresented as a successful scheduled timer execution**. Recheck `LastTriggerUSec` and service journal *after* the scheduled trigger, and verify a new destination object.
- The Dokploy **PostgreSQL backup schedule / object destination and Dokploy system backup schedule** have not yet been checked in the production dashboard. No academic production DB has been provisioned.

### Operator-provided Dokploy database backup listing (18 November 2026)

- The production `DB-BLOG` Dokploy **Backups** tab showed an **Active** backup destination `Oracle Komitehane Backups` for database `komitehane-db-blog`, with schedule `0 0 * * *`, storage prefix `komitehane/postgres`, custom name `komitehane-db`, and `Keep Latest 14` (**14 versions**, not a 14-day TTL).
- The operator opened **Backup Files**, which listed **one** downloadable `.sql.gz` object: `komitehane-db-2026-11-17T21-14-14-014Z.sql.gz`, displayed as **18 November 2026, 00:14:14** local time, **685.97 KB**. This confirms a remotely listed backup object. It does not alone prove the scheduled trigger, gzip payload integrity, completeness, or a successful *isolated* PostgreSQL restore.
- **Remaining DB backup gate:** Download/retrieve the backup privately, check its gzip and SQL contents without publishing data, restore into a disposable **separate** PostgreSQL 18 instance/database, check expected tables and representative row counts, and destroy only the disposable environment after validation. Never restore into `komitehane-db-blog` or touch the blog schema.

## Safe read-only first-pass commands on the **actual** VPS

Run as a trusted operator. These commands do not print secret values, mutate services, or connect to a DB:

```sh
docker service ls --format 'table {{.Name}}\t{{.Replicas}}'
docker service inspect komitehane-frontend-5plyok --format '{{range .Endpoint.Ports}}{{println .PublishedPort}}{{end}}'
docker service inspect komitehane-dbblog-hbcbpm --format '{{range .Endpoint.Ports}}{{println .PublishedPort}}{{end}}'
docker service inspect dokploy-traefik --format '{{range .Spec.TaskTemplate.ContainerSpec.Args}}{{println .}}{{end}}' | grep -Ei 'forwardedheaders|entrypoints|api\.insecure' || true
systemctl show komitehane-media-backup.timer -p ActiveState -p LastTriggerUSec -p NextElapseUSecRealtime
systemctl show komitehane-media-backup.service -p Result -p ExecMainStatus
```

**Do not paste raw environment variables, DB URLs, R2 access keys, private CA material, or `docker inspect` JSON including `.Env` into an issue or public chat.**

## Release gate

Do not mark PR #5 ready until the latest dual-version CI is green, the real PostgreSQL 18 / Traefik / backup / rollback checks above are independently attested, the legacy Vercel requirement is removed or shown not to block merge, and an operator explicitly authorizes the production academic DB provisioning. Real institutional rules remain out of scope for this cycle.
