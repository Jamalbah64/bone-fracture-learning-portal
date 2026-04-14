function Settings() {
  return (
    <section className="settings-page">
      <div className="container">
        <h1>Settings</h1>
        <p className="muted">
          Advanced options for the AI fracture workflow will live here.
        </p>

        <div className="card settings-local-data">
          <h2>Data Storage</h2>
          <p className="muted settings-local-desc">
            All scan data, analytics, and patient records are now stored on the
            server. Your data is protected by role-based access control — you can
            only see data you are authorized to view.
          </p>

          <ul style={{ marginTop: 12, lineHeight: 1.8, fontSize: 14 }}>
            <li>
              <strong>Patients</strong> can only view their own scans and data.
            </li>
            <li>
              <strong>Radiologists</strong> can view scans they uploaded or for
              patients assigned to them.
            </li>
            <li>
              <strong>Head Radiologists</strong> can view all patient data and
              manage assignments.
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

export default Settings;
