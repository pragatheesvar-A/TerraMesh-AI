# TerraMesh AI — Pilot Deployment Checklist

> **STATUS: FUTURE PROCEDURE — no pilot has been conducted.** Execute only
> after docs/HARDWARE_INTEGRATION_CHECKLIST.md passes at the site.

## Site selection

- [ ] One active panel + one reference (quiet) panel for contrast
- [ ] Surface access for solar nodes + gateway backhaul (4G/Wi-Fi/Ethernet)
- [ ] Reference survey markers installable within the mesh footprint

## Rollout

- [ ] Gateway first (verify uplink via `/health` MQTT section)
- [ ] Reference-panel nodes (baseline dataset begins immediately)
- [ ] Active-panel nodes (blasting schedule handed to operators for `blast_flag` semantics)
- [ ] Control-room operator accounts provisioned with correct RBAC roles
      (`ADMIN`/`CONTROL_ROOM_OPERATOR`/`SAFETY_OFFICER`/`ENGINEER`)

## Operational readiness gates (all must pass before alerting is trusted)

1. 14-day baseline dataset complete (docs/FIELD_VALIDATION_PLAN.md Phase V1)
2. FP/FN rates measured (Phase V4) and thresholds tuned per
   docs/THRESHOLD_VALIDATION_PLAN.md
3. One full alert-path drill executed with all channels' real outcomes recorded
4. One evacuation drill through the operator-authorization flow
5. Operator sign-off + mine management acknowledgment on file

## During the pilot

- Daily: check `/health`, audit trail growth, battery/solar curves
- Weekly: reference cross-check + drift review
- Continuous: every alert root-caused (true event / sensor fault / blast /
  comms loss) — the failure-matrix test suite is the software analogue; the
  pilot records the real-world version

## Exit criteria

- Pilot report written with all evidence from docs/FIELD_VALIDATION_PLAN.md
- Platform re-classified by the next zero-trust audit based on that evidence
  (only `FIELD VALIDATED` if every criterion is met with recorded data)
