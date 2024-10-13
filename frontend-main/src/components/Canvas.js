import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stage, Layer, Line, Text } from 'react-konva';
import axios from 'axios';
import './Canvas.css';

const API_BASE_URL = 'http://localhost:5000/api';

const Canvas = ({ notebookName, initialElements = [], onBack }) => {
    const navigate = useNavigate();
    const [elements, setElements] = useState(initialElements);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentLine, setCurrentLine] = useState([]);
    const [color, setColor] = useState('black');
    const [strokeWidth, setStrokeWidth] = useState(2);
    const [tool, setTool] = useState('pencil');
    const [textInput, setTextInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleMouseDown = (e) => {
        const pos = e.target.getStage().getPointerPosition();
        if (tool === 'pencil') {
            setIsDrawing(true);
            setCurrentLine([pos.x, pos.y]);
        } else if (tool === 'eraser') {
            eraseLines(pos);
        } else if (tool === 'text') {
            handleAddText(pos);
        }
    };

    const handleMouseUp = () => {
        if (isDrawing) {
            const newLine = { points: currentLine, color, strokeWidth, id: `line${Date.now()}` };
            setElements(prev => [...prev, newLine]);
            setCurrentLine([]);
            setIsDrawing(false);
        }
    };

    const handleMouseMove = (e) => {
        if (isDrawing) {
            const pos = e.target.getStage().getPointerPosition();
            setCurrentLine(prev => [...prev, pos.x, pos.y]);
        }
    };

    const handleAddText = (position) => {
        if (textInput) {
            const newText = { text: textInput, x: position.x, y: position.y, id: `text${Date.now()}`, isText: true };
            setElements(prev => [...prev, newText]);
            setTextInput('');
            setTool('pencil');
        }
    };

    const eraseLines = (position) => {
        setElements(prev => prev.filter(element => {
            if (element.points) {
                return !isLineNear(element.points, position);
            }
            return true;
        }));
    };

    const isLineNear = (points, position) => {
        for (let i = 0; i < points.length - 2; i += 2) {
            const x1 = points[i];
            const y1 = points[i + 1];
            const x2 = points[i + 2];
            const y2 = points[i + 3];
            if (isPointNearLineSegment(position, { x1, y1, x2, y2 })) {
                return true;
            }
        }
        return false;
    };

    const isPointNearLineSegment = (point, line) => {
        const { x1, y1, x2, y2 } = line;
        const A = point.x - x1;
        const B = point.y - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        const dot = A * C + B * D;
        const len_sq = C * C + D * D;
        const param = len_sq ? dot / len_sq : -1;
        let xx, yy;

        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        const dx = point.x - xx;
        const dy = point.y - yy;
        return (dx * dx + dy * dy) <= (10 * 10); // Eraser radius
    };

    const saveCanvas = async () => {
        if (!notebookName) {
            setError('Notebook name is required.');
            return;
        }
        const notebookData = { elements };
        try {
            setIsLoading(true);
            await axios.post(`${API_BASE_URL}/notebooks/${notebookName}`, notebookData);
            alert("Notebook saved successfully!");
        } catch (error) {
            console.error('Error saving notebook:', error);
            setError('Failed to save notebook. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="canvas-container">
            <div className="toolbar">
                <button className="back-button" onClick={() => navigate('/')}>←</button>
                <button onClick={() => setTool('pencil')}>✏️</button>
                <button onClick={() => setTool('eraser')}>🗑️</button>
                <button onClick={() => setTool('text')}>📝</button>
                <div className="color-picker">
                    <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="color-input"
                        id="color-picker"
                    />
                </div>
                <input
                    type="range"
                    min="1"
                    max="20"
                    value={strokeWidth}
                    onChange={(e) => setStrokeWidth(parseInt(e.target.value, 10))}
                    style={{ margin: '0 10px' }}
                />
                <button onClick={saveCanvas}>💾</button>
                {tool === 'text' && (
                    <input
                        type="text"
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        placeholder="Enter text"
                    />
                )}
            </div>
            {isLoading && <div className="loading">Saving...</div>}
            {error && <div className="error">Error: {error}</div>}
            <Stage
                width={window.innerWidth}
                height={window.innerHeight}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
            >
                <Layer>
                    {elements.map((element) => {
                        if (element.points) {
                            return (
                                <Line
                                    key={element.id}
                                    points={element.points}
                                    stroke={element.color}
                                    strokeWidth={element.strokeWidth}
                                    lineCap="round"
                                    lineJoin="round"
                                />
                            );
                        } else if (element.isText) {
                            return (
                                <Text
                                    key={element.id}
                                    text={element.text}
                                    x={element.x}
                                    y={element.y}
                                    draggable
                                />
                            );
                        }
                        return null;
                    })}
                    {isDrawing && tool === 'pencil' && (
                        <Line
                            points={currentLine}
                            stroke={color}
                            strokeWidth={strokeWidth}
                            lineCap="round"
                            lineJoin="round"
                        />
                    )}
                </Layer>
            </Stage>
        </div>
    );
};

export default Canvas;