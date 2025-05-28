// React 2048 Game (정상 동작 복원 버전)
import React, { useEffect, useState } from "react";
import "./App.css";
import AdBlock from "./components/AdBlock";
import supabase from './dbClient';
import { fetchRanking } from './fetchRanking';

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

const App = () => {
  const [grid, setGrid] = useState(getInitialGrid);
  const [score, setScore] = useState(0);
  const [isOver, setIsOver] = useState(false);
  const [nickname, setNickname] = useState("");
  const [ranking, setRanking] = useState([]);

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
    fetchRanking().then(setRanking);
    return () => window.removeEventListener("keydown", handleKey);
  }, [grid, isOver]);

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

  return (
    <div className="game-container">
      <h1>2048 Game</h1>
      <input
        type="text"
        placeholder="닉네임"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        style={{ marginBottom: 10 }}
      />
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
    </div>
  );
};

export default App;
