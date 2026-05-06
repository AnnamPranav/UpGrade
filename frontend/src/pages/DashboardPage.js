import React from "react";

function DashboardPage() {
  return (
    <div className="page">
      <div className="container">
        <h1>User Dashboard</h1>

        <p className="subtitle">
          Dashboard prepared for future scaling.
        </p>

        <div className="feedback-card">
          <h3>Future Features</h3>

          <ul style={{ textAlign: "left" }}>
            <li>Interview history</li>
            <li>Performance analytics</li>
            <li>Skill tracking</li>
            <li>Resume upload</li>
            <li>Multi-user support</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;