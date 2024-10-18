import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Line, Text, Rect } from 'react-konva';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:5000/api';

const Canvas = ({ notebookName }) => {
    const [pages, setPages] = useState([[]]);
    const [currentPage, setCurrentPage] = useState(0);
    const [isDrawing, setIsDrawing] = useState(false);
    const [tool, setTool] = useState('pencil');
    const [color, setColor] = useState('#000000');
    const [strokeWidth, setStrokeWidth] = useState(2);
    const [textInput, setTextInput] = useState('');
    const [history, setHistory] = useState([]);
    const [historyStep, setHistoryStep] = useState(0);
    const [aiResponse, setAiResponse] = useState('');
    const stageRef = useRef(null);
    const navigate = useNavigate();

    const pageRatio = 9 / 16;
    const pageWidth = window.innerWidth * 0.8;
    const pageHeight = pageWidth * pageRatio;

    useEffect(() => {
        loadNotebook();
    }, [notebookName]);

    const loadNotebook = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/notebooks/${notebookName}`);
            setPages(response.data.pages || [[]]);
            setHistory([response.data.pages || [[]]]);
            setHistoryStep(0);
        } catch (error) {
            console.error('Error loading notebook:', error);
            alert('Failed to load notebook. Please try again.');
        }
    };

    const handleMouseDown = (e) => {
        if (tool === 'pencil' || tool === 'eraser') {
            setIsDrawing(true);
            const pos = e.target.getStage().getPointerPosition();
            const newPages = [...pages];
            newPages[currentPage] = [...newPages[currentPage], { tool, points: [pos.x, pos.y], color, strokeWidth }];
            setPages(newPages);
        } else if (tool === 'text') {
            const pos = e.target.getStage().getPointerPosition();
            if (textInput) {
                const newPages = [...pages];
                newPages[currentPage] = [...newPages[currentPage], { tool, x: pos.x, y: pos.y, text: textInput, color }];
                setPages(newPages);
                setTextInput('');
            }
        }
    };

    const handleMouseMove = (e) => {
        if (!isDrawing) return;
        const stage = e.target.getStage();
        const point = stage.getPointerPosition();
        const newPages = [...pages];
        let lastLine = newPages[currentPage][newPages[currentPage].length - 1];
        lastLine.points = lastLine.points.concat([point.x, point.y]);
        setPages(newPages);
    };

    const handleMouseUp = () => {
        setIsDrawing(false);
        addToHistory();
    };

    const addToHistory = () => {
        const newHistory = history.slice(0, historyStep + 1);
        newHistory.push(pages);
        setHistory(newHistory);
        setHistoryStep(newHistory.length - 1);
    };

    const undo = () => {
        if (historyStep > 0) {
            setHistoryStep(historyStep - 1);
            setPages(history[historyStep - 1]);
        }
    };

    const redo = () => {
        if (historyStep < history.length - 1) {
            setHistoryStep(historyStep + 1);
            setPages(history[historyStep + 1]);
        }
    };

    const saveCanvas = async () => {
        if (!notebookName) {
            alert('Notebook name is required.');
            return;
        }
        try {
            const stage = stageRef.current;
            const dataURL = stage.toDataURL({ pixelRatio: 2 });
            await axios.post(`${API_BASE_URL}/notebooks/${notebookName}`, { 
                pages,
                imageData: dataURL
            });
            alert("Notebook saved successfully!");
        } catch (error) {
            console.error('Error saving notebook:', error);
            alert('Failed to save notebook. Please try again.');
        }
    };

    const analyzeWithAI = async () => {
        try {
            const stage = stageRef.current;
            const dataURL = stage.toDataURL({ pixelRatio: 2 });
            const response = await axios.post(`${API_BASE_URL}/analyze-image`, { image: dataURL });
            setAiResponse(response.data.result);
        } catch (error) {
            console.error('Error analyzing image:', error);
            alert('Failed to analyze image. Please try again.');
        }
    };

    const handleBack = () => {
        navigate('/');
    };

    const addPage = () => {
        setPages([...pages, []]);
        setCurrentPage(pages.length);
    };

    const changePage = (pageIndex) => {
        setCurrentPage(pageIndex);
    };

    return (
        <div className="canvas-container">
            <div className="toolbar">
                <button onClick={handleBack}>Back</button>
                <button onClick={() => setTool('pencil')}>Pencil</button>
                <button onClick={() => setTool('eraser')}>Eraser</button>
                <button onClick={() => setTool('text')}>Text</button>
                <div className="color-picker">
                    <label>Color:</label>
                    <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                    />
                </div>
                <div className="stroke-width-picker">
                    <label>Width:</label>
                    <input
                        type="range"
                        min="1"
                        max="20"
                        value={strokeWidth}
                        onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
                    />
                </div>
                {tool === 'text' && (
                    <input
                        type="text"
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        placeholder="Enter text"
                    />
                )}
                <button onClick={saveCanvas}>Save</button>
                <button onClick={analyzeWithAI}>AI</button>
                <button onClick={undo}>Undo</button>
                <button onClick={redo}>Redo</button>
                <button onClick={addPage}>Add Page</button>
            </div>
            <div className="page-navigation">
                {pages.map((_, index) => (
                    <button key={index} onClick={() => changePage(index)}>
                        Page {index + 1}
                    </button>
                ))}
            </div>
            <Stage
                width={pageWidth}
                height={pageHeight}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                ref={stageRef}
            >
                <Layer>
                    <Rect
                        x={0}
                        y={0}
                        width={pageWidth}
                        height={pageHeight}
                        fill="white"
                    />
                    {pages[currentPage].map((element, i) => {
                        if (element.tool === 'pencil' || element.tool === 'eraser') {
                            return (
                                <Line
                                    key={i}
                                    points={element.points}
                                    stroke={element.tool === 'eraser' ? 'white' : element.color}
                                    strokeWidth={element.strokeWidth}
                                    tension={0.5}
                                    lineCap="round"
                                    globalCompositeOperation={
                                        element.tool === 'eraser' ? 'destination-out' : 'source-over'
                                    }
                                />
                            );
                        } else if (element.tool === 'text') {
                            return (
                                <Text
                                    key={i}
                                    x={element.x}
                                    y={element.y}
                                    text={element.text}
                                    fontSize={16}
                                    fill={element.color}
                                />
                            );
                        }
                        return null;
                    })}
                </Layer>
            </Stage>
            {aiResponse && (
                <div className="ai-response">
                    <h3>AI Analysis:</h3>
                    <p>{aiResponse}</p>
                </div>
            )}
        </div>
    );
};

export default Canvas;