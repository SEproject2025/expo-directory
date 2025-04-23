import React, { useState, useEffect, useRef } from "react";
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useDrag } from 'react-use-gesture';
import { Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';
import "./App.css";

function Arrow({ rotation }) {
  const meshRef = useRef();
  
  return (
    <mesh ref={meshRef} rotation={rotation} position={[0, 0, 0]}>
      {/* Arrow shaft */}
      <cylinderGeometry args={[0.05, 0.05, 2, 16]} />
      <meshStandardMaterial color="white" />
      {/* Arrowhead */}
      <mesh position={[0, 1.1, 0]}>
        <coneGeometry args={[0.15, 0.4, 32]} />
        <meshStandardMaterial color="white" />
      </mesh>
    </mesh>
  );
}

function CountdownArrowApp() {
  const [timeLeft, setTimeLeft] = useState(0);
  const [nextTargetTime, setNextTargetTime] = useState(null);
  const [rotation, setRotation] = useState([Math.PI / 2, 0, 0]);
  const [isDragging, setIsDragging] = useState(false); // Track if dragging
  const [isLocked, setIsLocked] = useState(false); // State to lock/unlock rotation
  const [startPos, setStartPos] = useState({ x: 0, y: 0 }); // Track initial mouse position during drag
  const [useCanvas, setUseCanvas] = useState(true);
  const [angle, setAngle] = useState(0);
  const canvasRef = useRef(null);

  const handleMouseDown = (event) => {
    setIsDragging(true);
    setStartPos({ x: event.clientX, y: event.clientY });
  };

  const handleMouseMove = (event) => {
    if (!useCanvas) return;
    if (isLocked) return;
    if (!isDragging) return; // Only rotate if dragging

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const deltaX = mouseX - startPos.x;
    const deltaY = mouseY - startPos.y;

    // Update rotation based on the drag movement
    setRotation([
      0, // No Z-axis rotation
      (deltaX / rect.width) * Math.PI * 2, // Horizontal drag - Rotate Y
      (deltaY / rect.height) * Math.PI, // Vertical drag - Rotate X
    ]);
  };

  const handleMouseUp = () => {
    setIsDragging(false); // Stop rotation when mouse is released
  };

  const handleKeyDown = (event) => {
    if (event.key === 'l' || event.key === 'L') {
      setIsLocked((prev) => !prev);
    }
    if (event.key === 'o' || event.key === 'O') {
      setUseCanvas((prev) => !prev);
    }
  };

  const handleClick = () => {
    setAngle((prev) => (prev + 90) % 360);
  };

  useEffect(() => {
    const canvas = canvasRef.current;

    canvas.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("keydown", handleKeyDown); // Listen for key events

    // Clean up event listeners on component unmount
    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDragging, startPos, isLocked]); // Added isLocked to effect dependencies


  const updateNextTargetTime = (targetList) => {
    const now = new Date();
    const futureTimes = targetList
      .map(t => new Date(t))
      .filter(t => t > now)
      .sort((a, b) => a - b);

    if (futureTimes.length > 0) {
      setNextTargetTime(futureTimes[0]);
    } else {
      setNextTargetTime(null);
    }
  };

  useEffect(() => {
    const fetchTargetTimes = () => {
      fetch('/target-time.json')
        .then((res) => res.json())
        .then((data) => updateNextTargetTime(data.targetTimes || []))
        .catch((err) => console.error("Failed to fetch target times", err));
    };

    fetchTargetTimes();
    const intervalId = setInterval(fetchTargetTimes, 10000); // poll every 10s

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!nextTargetTime) return;

    const timer = setInterval(() => {
      const now = new Date();
      const diff = nextTargetTime - now;

      if (diff <= 0) {
        setTimeLeft(0);
        // Re-check immediately in case the next target time has arrived
        setNextTargetTime(null); 
      } else {
        setTimeLeft(Math.floor(diff / 1000));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [nextTargetTime]);

  const formatTime = (totalSeconds) => {
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  return (
    <div
      className="center-container"
      style={{ cursor: 'grab' }}
      onClick={handleClick}
    >
      <h1>Next presentation in:</h1>
      <h1 style = {{textAlign: 'center'}}>{formatTime(timeLeft)}</h1>
      {useCanvas ? (
        <Canvas style={{ width: '100%', height: 'auto' }} camera={{ position: [0, 0, 2] }} ref={canvasRef}>
          <ambientLight />
          <directionalLight position={[2, 2, 5]} />
          <Arrow rotation={rotation} />
        </Canvas>
      ) : (
        <img style={{
          width: '100%', 
          height: 'auto',
          transform: `rotate(${angle}deg)`,
          transition: 'transform 0.3s ease-in-out',
          maxWidth: '200px'
        }} src="/arrow-pointing-right.svg"></img>
      )}
      <h3>* follow the arrow to get to the next presentation</h3>
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
