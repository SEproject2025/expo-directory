import React, { useState, useEffect, useRef } from "react";
import "./App.css";

function App() {
  const [filter, setFilter] = useState("");
  const [projects, setProjects] = useState([]);
  
  // Fetch the project data from the JSON file
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch("/projects.json");
        const data = await response.json();
        setProjects(data);
      } catch (error) {
        console.error("Error loading project data:", error);
      }
    };
    fetchProjects();
  }, []);

  // Extract unique contributors
  const contributors = [...new Set(projects.flatMap(p => p.contributors))];

  // Filter projects based on contributor
  const filteredProjects = filter
    ? projects.filter(p => p.contributors.includes(filter))
    : projects;

  const cardRefs = useRef([]);
  const angleOffset = useRef(0);

  const cardWidth = 200; // Define the width of your card
  const cardHeight = 260; // Define the height of your card

  useEffect(() => {
    let t = 0;

    function calculateRadius(numCards) {
      // Ensure there's enough space between the cards by calculating the radius
      const maxCardsPerRow = 6; // Max number of cards per row (adjustable)
      const padding = 50; // Padding around the cards
      const angleBetweenCards = Math.PI * 2 / numCards;

      // Ensure the radius is large enough based on card count and width/height
      const requiredRadius = (Math.max(numCards, maxCardsPerRow) * cardWidth) / (2 * Math.sin(angleBetweenCards / 2));
      
      // Define a maximum radius that ensures cards don’t spread too far apart
      const maxRadius = Math.min(window.innerWidth, window.innerHeight) / 2 - cardWidth / 2 - padding;

      // Use the smaller of the required or max radius to avoid too much space
      const adjustedRadius = Math.min(requiredRadius, maxRadius);
      
      return adjustedRadius;
    }

    const radius = calculateRadius(filteredProjects.length); // Get radius based on the number of cards


    function animate() {

      cardRefs.current.forEach((card, i) => {
        if (!card) return;

        const angle = (i / filteredProjects.length) * 2 * Math.PI + angleOffset.current;
        const x = Math.cos(angle) * radius - card.offsetWidth / 2;
        const y = Math.sin(angle) * radius - card.offsetHeight / 2;

        card.style.transform = `translate(${x}px, ${y}px)`;
      });

      requestAnimationFrame(animate);
    }

    animate();
  }, [filteredProjects.length]);

  return (
    <div className="App">
      <div className="center-container">
        <h2>Software Engineering Expo</h2>
      </div>

      <div className="rotating-container">
        {filteredProjects.map((project, idx) => (
          <div
            key={idx}
            className="card"
            ref={(el) => (cardRefs.current[idx] = el)}
            onClick={() => window.open(project.link, "_blank")}
          >
            <h3>{project.title}</h3>
            <p><strong>By:</strong> {project.contributors.join(", ")}</p>

            <a href={project.link} target="_blank" rel="noreferrer">View Project</a>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
