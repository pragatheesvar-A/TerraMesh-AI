# RBAC Matrix

| Resource | Viewer | Engineer | Operator | Safety | Manager | Admin |
|---|---|---|---|---|---|---|
| Telemetry | READ | READ | READ | READ | READ | READ |
| Worker Data | NONE | READ | READ | READ | READ | READ |
| Alerts | READ | READ | ACKNOWLEDGE | ACKNOWLEDGE | ACKNOWLEDGE | ACKNOWLEDGE |
| Evacuation | NONE | NONE | DISPATCH | DISPATCH | DISPATCH | DISPATCH |
| Geofences | NONE | CONFIGURE | READ | CONFIGURE | CONFIGURE | ADMINISTER |
| System Config | NONE | NONE | NONE | NONE | READ | ADMINISTER |
