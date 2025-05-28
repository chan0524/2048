// React 2048 Game (AdSense Web 적용)
import React, { useEffect, useState } from "react";
import "./App.css";
import AdBlock from "./components/AdBlock";

const SIZE = 4;
const getInitialGrid = () => {
  const grid = Array(SIZE).fill(null).map(() => Array(SIZE).fill(0));
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

const AdBanner = () => {
  useEffect(() => {
    try {
      if (window.adsbygoogle && Array.isArray(window.adsbygoogle)) {
        window.adsbygoogle.push({});
      }
    } catch (e) {
      console.error("AdSense error:", e);
    }
  }, []);

  return (
    <ins className="adsbygoogle"
      style={{ display: "block" }}
      data-ad-client="ca-pub-6508965231698296"
      data-ad-slot="9650293147"
      data-ad-format="auto"
      data-full-width-responsive="true"></ins>
  );
};

const App = () => {
  const [grid, setGrid] = useState(getInitialGrid);
  const [score, setScore] = useState(0);
  const [isOver, setIsOver] = useState(false);
  const [showMain, setShowMain] = useState(true);
  const [scoreHistory, setScoreHistory] = useState(() => {
    return JSON.parse(localStorage.getItem("scoreHistory")) || [];
  });
  const [restartCount, setRestartCount] = useState(0);

  let touchStartX = 0;
  let touchStartY = 0;

  const handleKeyDown = (e) => {
    if (!isOver) handleMove(e.key);
  };

  const handleTouchStart = (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (isOver) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (Math.max(absX, absY) > 30) {
      if (absX > absY) {
        handleMove(dx > 0 ? "ArrowRight" : "ArrowLeft");
      } else {
        handleMove(dy > 0 ? "ArrowDown" : "ArrowUp");
      }
    }
  };

  const handleMove = (direction) => {
    let newGrid = cloneGrid(grid);
    let moved = false;
    if (direction === "ArrowLeft") moved = moveLeft(newGrid);
    else if (direction === "ArrowRight") moved = moveRight(newGrid);
    else if (direction === "ArrowUp") moved = moveUp(newGrid);
    else if (direction === "ArrowDown") moved = moveDown(newGrid);

    if (moved) {
      addNumber(newGrid);
      setGrid(newGrid);
      if (isGameOver(newGrid)) {
        setIsOver(true);
        const newHistory = [...scoreHistory, score].sort((a, b) => b - a).slice(0, 5);
        setScoreHistory(newHistory);
        localStorage.setItem("scoreHistory", JSON.stringify(newHistory));
      }
    }
  };

  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchend", handleTouchEnd);
    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  });

  const combineRow = (row) => {
    let scoreGained = 0;
    row = row.filter((v) => v !== 0);
    for (let i = 0; i < row.length - 1; i++) {
      if (row[i] === row[i + 1]) {
        row[i] *= 2;
        scoreGained += row[i];
        row[i + 1] = 0;
      }
    }
    row = row.filter((v) => v !== 0);
    while (row.length < SIZE) row.push(0);
    return { row, scoreGained };
  };

  const moveLeft = (grid) => {
    let moved = false;
    let totalScore = 0;
    for (let r = 0; r < SIZE; r++) {
      const { row, scoreGained } = combineRow(grid[r]);
      if (JSON.stringify(row) !== JSON.stringify(grid[r])) moved = true;
      grid[r] = row;
      totalScore += scoreGained;
    }
    setScore((s) => s + totalScore);
    return moved;
  };

  const moveRight = (grid) => {
    for (let r = 0; r < SIZE; r++) grid[r].reverse();
    let moved = moveLeft(grid);
    for (let r = 0; r < SIZE; r++) grid[r].reverse();
    return moved;
  };

  const moveUp = (grid) => {
    let moved = false;
    for (let c = 0; c < SIZE; c++) {
      let col = grid.map((row) => row[c]);
      const { row: newCol, scoreGained } = combineRow(col);
      if (JSON.stringify(newCol) !== JSON.stringify(col)) moved = true;
      for (let r = 0; r < SIZE; r++) grid[r][c] = newCol[r];
      setScore((s) => s + scoreGained);
    }
    return moved;
  };

  const moveDown = (grid) => {
    let moved = false;
    for (let c = 0; c < SIZE; c++) {
      let col = grid.map((row) => row[c]).reverse();
      const { row: newCol, scoreGained } = combineRow(col);
      newCol.reverse();
      if (JSON.stringify(newCol) !== JSON.stringify(grid.map((row) => row[c]))) moved = true;
      for (let r = 0; r < SIZE; r++) grid[r][c] = newCol[r];
      setScore((s) => s + scoreGained);
    }
    return moved;
  };

  const startGame = () => {
    if ((restartCount + 1) % 2 === 0) {
      alert("[광고] 전체광고가 여기에 들어갈 수 있습니다.");
    }
    setRestartCount(restartCount + 1);
    setGrid(getInitialGrid());
    setScore(0);
    setIsOver(false);
    setShowMain(false);
  };

  const goToMain = () => {
    setShowMain(true);
  };

  if (showMain) {
    return (
      <div className="game-container">
        <h1>2048 Game</h1>
        <AdBlock slot="7685279248" />
        <button onClick={startGame}>Start Game</button>
        <h2>Top Scores</h2>
        <ul>
          {scoreHistory.map((s, i) => (
            <li key={i}>#{i + 1}: {s}</li>
          ))}
        </ul>
        <AdBanner />
      </div>
    );
  }

  return (
    <div className="game-container">
      <h1>2048 Game</h1>
      <div className="score">Score: {score}</div>
      <div className="grid">
        <AdBlock slot="1914077817" />
        {grid.map((row, rowIndex) => (
          <div className="row" key={rowIndex}>
            {row.map((cell, colIndex) => (
              <div className="cell" key={colIndex}>
                {cell !== 0 ? cell : ""}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div style={{ marginTop: '10px' }}>
        {!isOver && (
          <>
            <button onClick={startGame}>Restart</button>
            <button onClick={goToMain} style={{ marginLeft: '10px' }}>Main</button>
            <AdBlock slot="9650293147" />
          </>
        )}
        {isOver && (
          <div className="game-over">
            <h2>Game Over!</h2>
            <button onClick={startGame}>Restart</button>
            <button onClick={goToMain}>Main</button>
          </div>
        )}
      </div>
      <AdBanner />
    </div>
  );
};

export default App;