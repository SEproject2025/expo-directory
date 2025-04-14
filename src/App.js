import React, { useState } from "react";
import "./App.css";

const projects = [
  {
    name: "Evera",
    description: "A great app.",
    link: "https://evera.green",
    contributors: ["Anna", "Jared", "Gabriel", "Daniel", "Logan"],
  },
  {
    name: "Evangelium",
    description: "Another cool project.",
    link: "https://evangelium.app",
    contributors: ["Caleb", "Rachel", "Christian", "Jez", "Niwe"],
  },
  {
    name: "Bolt Away",
    description: "Not available here at the moment.",
    link: "#",
    contributors: ["Jonah", "Steven", "Jack", "Beau"],
  },
  // Add more projects here...
];

function App() {
  const [filter, setFilter] = useState("");

   // Extract unique contributors
   const contributors = [...new Set(projects.flatMap(p => p.contributors))];

   // Filter projects based on contributor
   const filteredProjects = filter
     ? projects.filter(p => p.contributors.includes(filter))
     : projects;

  return (
    <div className="App">
      <h1>Software Engineering Expo</h1>

      <select onChange={(e) => setFilter(e.target.value)} value={filter}>
        <option value="">All contributors</option>
        {contributors.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <div className="card-grid">
        {filteredProjects.map((project, idx) => (
          <div key={idx} className="card" onClick={() => window.open(project.link, "_blank")}>
            <div className="card-inner">
              <div className="card-front">
                <h3>{project.title}</h3>
                <p><strong>{project.contributors.join(", ")}</strong></p>
              </div>
              <div className="card-back">
                <p>{project.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
