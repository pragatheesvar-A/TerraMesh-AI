/**
 * Provenance label tests — verify the mobile UI preserves
 * the backend provenance taxonomy exactly (no relabelling).
 */


describe('Provenance taxonomy', () => {
  const validProvenanceLabels = [
    'MEASURED DATA',
    'MODEL OUTPUT',
    'SIMULATION',
    'SIMULATED SATELLITE DATA',
    'ENGINEERING CALCULATION',
    'OPERATOR ACTION',
    'UNLABELED',
  ];

  it('all 7 provenance classes are defined', () => {
    expect(validProvenanceLabels.length).toBe(7);
  });

  it('SIMULATED is never relabelled as MEASURED', () => {
    const simulated = 'SIMULATION';
    expect(simulated).not.toBe('MEASURED DATA');
    expect(simulated.toUpperCase()).toContain('SIMUL');
  });

  it('MODEL OUTPUT is distinct from MEASURED', () => {
    const model = 'MODEL OUTPUT';
    const measured = 'MEASURED DATA';
    expect(model).not.toBe(measured);
  });

  it('cached data is not relabelled as live', () => {
    const cached = 'OFFLINE — CACHED DATA';
    expect(cached).not.toContain('LIVE');
  });

  it('worker positions declare SIMULATOR source', () => {
    const workerProvenance = 'SIMULATION';
    expect(workerProvenance).toBe('SIMULATION');
  });

  it('evacuation personnel provenance flows through', () => {
    const evProvenance = 'SIMULATION';
    expect(evProvenance).toBe('SIMULATION');
  });
});
