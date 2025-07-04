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

function Thrift() {
  useEffect(() => {
    window.location.href = "/pcc-thrift-instructions.html";
  }, []);
  return null;
}


function PresentationCountdown({ styling }) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [nextTargetTime, setNextTargetTime] = useState(null);
  const [inProgressUntil, setInProgressUntil] = useState(null);

  const fetchAndUpdateTargetTime = async () => {
    if (inProgressUntil && new Date() < inProgressUntil) return; // Don't fetch new times mid-presentation

    try {
      const res = await fetch('/target-time.json');
      const data = await res.json();
      const targetList = data.targetTimes || [];

      const now = new Date();
      const futureTimes = targetList
        .map(t => new Date(t))
        .filter(t => t > now)
        .sort((a, b) => a - b);

      setNextTargetTime(futureTimes.length > 0 ? futureTimes[0] : null);
    } catch (err) {
      console.error("Failed to fetch target times", err);
    }
  };

  useEffect(() => {
    fetchAndUpdateTargetTime();
    const fetchInterval = setInterval(fetchAndUpdateTargetTime, 10000);
    return () => clearInterval(fetchInterval);
  }, [inProgressUntil]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();

      if (inProgressUntil && now < inProgressUntil) {
        setTimeLeft(0); // We're in presentation mode
        return;
      }

      if (nextTargetTime) {
        const diff = nextTargetTime - now;

        if (diff <= 0) {
          // Presentation just started
          const end = new Date(now.getTime() + 10 * 60 * 1000);
          setInProgressUntil(end);
          setNextTargetTime(null);
          setTimeLeft(0);
        } else {
          setTimeLeft(Math.floor(diff / 1000));
        }
      } else {
        setTimeLeft(0);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [nextTargetTime, inProgressUntil]);

  const formatTime = (seconds) => {
    const hrs = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const secs = String(seconds % 60).padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  return (
    <span style={styling}>
      {inProgressUntil && new Date() < inProgressUntil
        ? "Presentation in progress!"
        : timeLeft > 0
          ? formatTime(timeLeft)
          : "No more presentations today. :("}
    </span>
  );
}

function CountdownArrowApp() {
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



  return (
    <div
      className="center-container"
      style={{ cursor: 'grab' }}
      onClick={handleClick}
    >
      <h1 style = {{textAlign: 'center', fontSize: "3vw" }}>Next presentation in:</h1>
      <h1 style = {{textAlign: 'center', fontSize: "3vw" }}><PresentationCountdown/></h1>
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

  const contributors = [...new Set(projects.flatMap(p => p.contributors))];
  const filteredProjects = filter
    ? projects.filter(p => p.contributors.includes(filter))
    : projects;

  return (
    <div className="App">
      <h1>2025 Software Expo</h1>

      {/* Optional filter UI */}
      {/* <select onChange={(e) => setFilter(e.target.value)} value={filter}>
        <option value="">All Contributors</option>
        {contributors.map((name, idx) => (
          <option key={idx} value={name}>{name}</option>
        ))}
      </select> */}


      <div className="grid-container">
        <div className="card">
          <b>Next presentation in: </b>
          <PresentationCountdown/>
          <p>Did you know that there are expo themed stickers? Attend a presentation to get one!</p>
        </div>

        {filteredProjects.map((project, idx) => (
          <div
            key={idx}
            className="card"
            onClick={() => project.inperson !== true ? window.open(project.link, "_blank") : null }
          >
            <h3>{project.title}</h3>
            <p><strong>By:</strong> {project.contributors.join(", ")}</p>
            {project.inperson !== true ? (
              <a href="#">View Project</a>
            ) : (
              <i>{project.inpersonmessage}</i>
            )}
          </div>
        ))}

        <div className="card">
          <h3>Confused?</h3>
          <p>You should go to an expo presentation! Or, perhaps, talk to one of those blue-shirted people. ;)</p>
        </div>
      </div>
    </div>
  );
}


function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/countdown" element={<CountdownArrowApp />} />
      <Route path="/thrift" element={<Thrift />} />
    </Routes>
  );
}

export default App;
