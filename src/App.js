import React from "react"; // ✅ 이거 하나만
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import Game from "./components/Game";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/game" element={<Game />} />
      </Routes>
    </Router>
  );
};

export default App;



// components/Home.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchRanking } from "../fetchRanking";

const Home = () => {
  const [nickname, setNickname] = useState("");
  const [ranking, setRanking] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRanking().then(setRanking);
  }, []);

  const handleStart = () => {
    if (nickname.trim()) {
      navigate("/game", { state: { nickname } });
    } else {
      alert("닉네임을 입력해주세요!");
    }
  };

  return (
    <div className="home">
      <h1>2048 게임</h1>
      <input
        type="text"
        placeholder="닉네임"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
      />
      <button onClick={handleStart}>게임 시작</button>

      <h2>🏆 랭킹</h2>
      <ol>
        {ranking.map((r, i) => (
          <li key={i}>{r.nickname} - {r.score}</li>
        ))}
      </ol>
    </div>
  );
};

export default Home;


// components/Game.jsx
import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import supabase from "../dbClient";

const SIZE = 4;

const getInitialGrid = () => {
  const grid = Array(SIZE).fill().map(() => Array(SIZE).fill(0));
  addNumber(grid);
  addNumber(grid);
  return grid;
};

const addNumber = (grid) => {
  let empty = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] === 0) empty.push({ r, c });
    }
  }
  if (empty.length === 0) return;
  const { r, c } = empty[Math.floor(Math.random() * empty.length)];
  grid[r][c] = Math.random() < 0.9 ? 2 : 4;
};

const cloneGrid = (grid) => grid.map((row) => [...row]);

const isGameOver = (grid) => {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] === 0) return false;
      if (c < SIZE - 1 && grid[r][c] === grid[r][c + 1]) return false;
      if (r < SIZE - 1 && grid[r][c] === grid[r + 1][c]) return false;
    }
  }
  return true;
};

const combine = (arr) => {
  let newArr = arr.filter(v => v !== 0);
  let scoreGained = 0;
  for (let i = 0; i < newArr.length - 1; i++) {
    if (newArr[i] === newArr[i + 1]) {
      newArr[i] *= 2;
      scoreGained += newArr[i];
      newArr[i + 1] = 0;
    }
  }
  newArr = newArr.filter(v => v !== 0);
  while (newArr.length < SIZE) newArr.push(0);
  return { combined: newArr, scoreGained };
};

const Game = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const nickname = location.state?.nickname || "";

  const [grid, setGrid] = useState(getInitialGrid);
  const [score, setScore] = useState(0);
  const [isOver, setIsOver] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleKey = (e) => {
      if (isOver) return;
      const key = e.key;
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(key)) {
        e.preventDefault();
        move(key);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOver]);

  const move = (direction) => {
    let newGrid = cloneGrid(grid);
    let moved = false;
    let gained = 0;

    if (direction === "ArrowLeft") {
      for (let r = 0; r < SIZE; r++) {
        const { combined, scoreGained } = combine(newGrid[r]);
        if (JSON.stringify(combined) !== JSON.stringify(newGrid[r])) moved = true;
        newGrid[r] = combined;
        gained += scoreGained;
      }
    } else if (direction === "ArrowRight") {
      for (let r = 0; r < SIZE; r++) {
        const reversed = [...newGrid[r]].reverse();
        const { combined, scoreGained } = combine(reversed);
        const restored = combined.reverse();
        if (JSON.stringify(restored) !== JSON.stringify(newGrid[r])) moved = true;
        newGrid[r] = restored;
        gained += scoreGained;
      }
    } else if (direction === "ArrowUp") {
      for (let c = 0; c < SIZE; c++) {
        const col = newGrid.map(row => row[c]);
        const { combined, scoreGained } = combine(col);
        for (let r = 0; r < SIZE; r++) newGrid[r][c] = combined[r];
        if (JSON.stringify(col) !== JSON.stringify(combined)) moved = true;
        gained += scoreGained;
      }
    } else if (direction === "ArrowDown") {
      for (let c = 0; c < SIZE; c++) {
        const col = newGrid.map(row => row[c]).reverse();
        const { combined, scoreGained } = combine(col);
        const restored = combined.reverse();
        for (let r = 0; r < SIZE; r++) newGrid[r][c] = restored[r];
        if (JSON.stringify(newGrid.map(row => row[c])) !== JSON.stringify(restored)) moved = true;
        gained += scoreGained;
      }
    }

    if (moved) {
      addNumber(newGrid);
      setGrid(newGrid);
      setScore(prev => prev + gained);
      if (isGameOver(newGrid)) {
        setIsOver(true);
        if (nickname.trim()) {
          supabase.from("scores").insert([{ nickname, score }]);
        }
      }
    }
  };

  const restartGame = () => {
    setGrid(getInitialGrid());
    setScore(0);
    setIsOver(false);
  };

  return (
    <div className="game-container" ref={containerRef} tabIndex={0}>
      <h1>2048 Game</h1>
      <div className="score">Score: {score}</div>
      <div className="grid">
        {grid.map((row, i) => (
          <div className="row" key={i}>
            {row.map((cell, j) => (
              <div className="cell" key={j}>{cell !== 0 ? cell : ""}</div>
            ))}
          </div>
        ))}
      </div>
      {isOver && <h2>Game Over</h2>}
      <div style={{ marginTop: 20 }}>
        <button onClick={restartGame}>다시 시작</button>
        <button onClick={() => navigate("/")}>메인으로</button>
      </div>
    </div>
  );
};

export default Game;