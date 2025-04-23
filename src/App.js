import React, { useState, useEffect, useRef } from "react";
import { Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';
import "./App.css";

function CountdownArrowApp() {
  const [timeLeft, setTimeLeft] = useState(3600); // 1 hour in seconds
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const rotateArrow = () => setRotation((prev) => prev + 90);

  const formatTime = (totalSeconds) => {
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  return (
    <div className="center-container">
      <div className="text-6xl font-bold text-white mb-10">
        <h1>Next presentation in: {formatTime(timeLeft)}</h1>
      </div>
      <motion.div
        onClick={rotateArrow}
        className="cursor-pointer text-white relative"
        animate={{ rotate: rotation }}
        transition={{ duration: 0.4 }}
        style={{ width: '200px', height: '200px' }}
      >
        {/* External SVG for the arrow */}
        <img src="/arrow-pointing-right.svg" alt="Arrow" className="arrow" 
                  style={{ maxWidth: '100%', maxHeight: '100%' }}/>
      </motion.div>
    </div>
  );
}


function Home() {
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

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/countdown" element={<CountdownArrowApp />} />
    </Routes>
  );
}

export default App;
