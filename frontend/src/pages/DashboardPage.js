import React from "react";

function DashboardPage() {
  return (
    <div className="page">
      <div className="container">
        <h1>User Dashboard</h1>

        <p className="subtitle">
          Dashboard structure prepared for future scaling.
        </p>

        <div className="feedback-card">
          <h3>Future Features</h3>

          <ul style={{ textAlign: "left" }}>
            <li>Interview history</li>
            <li>Performance analytics</li>
            <li>Multiple user sessions</li>
            <li>Skill tracking</li>
            <li>Resume upload</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;