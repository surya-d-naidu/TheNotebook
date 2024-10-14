import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Line, Text, Transformer, Circle } from 'react-konva';
import axios from 'axios';
import './Canvas.css';

const API_BASE_URL = 'http://localhost:5000/api';

const Canvas = ({ notebookName, initialElements = [] }) => {
    const [elements, setElements] = useState(initialElements);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentLine, setCurrentLine] = useState([]);
    const [color, setColor] = useState('black');
    const [strokeWidth, setStrokeWidth] = useState(2);
    const [tool, setTool] = useState('pencil');
    const [textInput, setTextInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [eraserRadius] = useState(10);
    const [selectedId, selectShape] = useState(null);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [startPosition, setStartPosition] = useState({ x: 0, y: 0 });
    const [showStrokeWidthPopover, setShowStrokeWidthPopover] = useState(false);
    const stageRef = useRef(null);
    const transformerRef = useRef(null);

    useEffect(() => {
        setElements(initialElements);
    }, [initialElements]);

    useEffect(() => {
        if (selectedId) {
            const selectedNode = stageRef.current.findOne('#' + selectedId);
            if (selectedNode) {
                transformerRef.current.nodes([selectedNode]);
                transformerRef.current.getLayer().batchDraw();
            }
        } else {
            transformerRef.current.nodes([]);
            transformerRef.current.getLayer().batchDraw();
        }
    }, [selectedId]);

    const handleMouseDown = (e) => {
        const clickedOnEmpty = e.target === e.target.getStage();
        if (clickedOnEmpty) {
            selectShape(null);
        }

        if (tool === 'pencil') {
            setIsDrawing(true);
            const pos = e.target.getStage().getPointerPosition();
            setCurrentLine([pos.x, pos.y]);
        } else if (tool === 'eraser') {
            const pos = e.target.getStage().getPointerPosition();
            eraseLines(pos);
        } else if (tool === 'text') {
            const pos = e.target.getStage().getPointerPosition();
            handleAddText(pos);
        } else if (tool === 'pan') {
            setIsDragging(true);
            setStartPosition(e.target.getStage().getPointerPosition());
        }
    };

    const handleMouseUp = () => {
        if (tool === 'pencil' && isDrawing) {
            setIsDrawing(false);
            const newLine = { points: currentLine, color, strokeWidth, id: `line${Date.now()}` };
            setElements(prev => [...prev, newLine]);
            setCurrentLine([]);
        } else if (tool === 'pan') {
            setIsDragging(false);
        }
    };

    const handleMouseMove = (e) => {
        if (!isDrawing && !isDragging) return;
        const pos = e.target.getStage().getPointerPosition();
        if (tool === 'pencil' && isDrawing) {
            setCurrentLine(prev => [...prev, pos.x, pos.y]);
        } else if (tool === 'eraser') {
            eraseLines(pos);
        } else if (tool === 'pan' && isDragging) {
            const newPosition = {
                x: position.x + (pos.x - startPosition.x),
                y: position.y + (pos.y - startPosition.y)
            };
            setPosition(newPosition);
            setStartPosition(pos);
        }
    };

    const handleAddText = (position) => {
        if (textInput) {
            const newText = { 
                text: textInput, 
                x: position.x, 
                y: position.y, 
                id: `text${Date.now()}`, 
                isText: true 
            };
            setElements(prev => [...prev, newText]);
            setTextInput('');
            setTool('pencil');
        }
    };

    const handleTextEdit = (id, newText) => {
        setElements(prev => prev.map(el => 
            el.id === id ? { ...el, text: newText } : el
        ));
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
        return (dx * dx + dy * dy) <= (eraserRadius * eraserRadius);
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

    const handleWheel = (e) => {
        e.evt.preventDefault();
        const scaleBy = 1.1;
        const stage = e.target.getStage();
        const oldScale = stage.scaleX();
        const mousePointTo = {
            x: stage.getPointerPosition().x / oldScale - stage.x() / oldScale,
            y: stage.getPointerPosition().y / oldScale - stage.y() / oldScale
        };

        const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;

        setScale(newScale);
        setPosition({
            x: -(mousePointTo.x - stage.getPointerPosition().x / newScale) * newScale,
            y: -(mousePointTo.y - stage.getPointerPosition().y / newScale) * newScale
        });
    };

    return (
        <div className="canvas-container">
            <div className="toolbar">
                <button className="back-button" onClick={() => console.log('Back button clicked')}>
                    ← Back
                </button>
                <button onClick={() => setTool('pencil')}>✏️</button>
                <button onClick={() => setTool('eraser')}>🗑️</button>
                <button onClick={() => setTool('text')}>📝</button>
                <button onClick={() => setTool('pan')}>🖐️</button>
                <div className="color-picker">
                    <Circle radius={10} fill={color} stroke="black" strokeWidth={1} />
                    <input type="color" onChange={(e) => setColor(e.target.value)} />
                </div>
                <div className="stroke-width-picker">
                    <button onClick={() => setShowStrokeWidthPopover(!showStrokeWidthPopover)}>
                        Stroke Width
                    </button>
                    {showStrokeWidthPopover && (
                        <div className="stroke-width-popover">
                            <input
                                type="range"
                                min="1"
                                max="20"
                                value={strokeWidth}
                                onChange={(e) => setStrokeWidth(parseInt(e.target.value, 10))}
                            />
                        </div>
                    )}
                </div>
                <button onClick={saveCanvas}>💾 Save</button>
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
                height={window.innerHeight - 50} // Adjust for toolbar height
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                onWheel={handleWheel}
                scaleX={scale}
                scaleY={scale}
                x={position.x}
                y={position.y}
                ref={stageRef}
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
                                    draggable
                                    onClick={() => selectShape(element.id)}
                                />
                            );
                        } else if (element.isText) {
                            return (
                                <Text
                                    key={element.id}
                                    id={element.id}
                                    text={element.text}
                                    x={element.x}
                                    y={element.y}
                                    draggable
                                    onClick={() => selectShape(element.id)}
                                    onDblClick={(e) => {
                                        const newText = prompt('Edit text:', element.text);
                                        if (newText !== null) {
                                            handleTextEdit(element.id, newText);
                                        }
                                    }}
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
                    <Transformer
                        ref={transformerRef}
                        boundBoxFunc={(oldBox, newBox) => {
                            if (newBox.width < 5 || newBox.height < 5) {
                                return oldBox;
                            }
                            return newBox;
                        }}
                    />
                </Layer>
            </Stage>
        </div>
    );
};

export default Canvas;