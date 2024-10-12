import React, { useState, useEffect } from 'react';
import { Stage, Layer, Line, Text } from 'react-konva';
import axios from 'axios';

const Canvas = ({ notebookName }) => {
    const [lines, setLines] = useState([]);
    const [texts, setTexts] = useState([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentLine, setCurrentLine] = useState([]);
    const [color, setColor] = useState('black');
    const [tool, setTool] = useState('pencil');
    const [textInput, setTextInput] = useState('');

    // Load existing notebook data
    useEffect(() => {
        const fetchNotebook = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/api/notebooks/${notebookName}`);
                setLines(response.data.lines || []);
                setTexts(response.data.texts || []);
            } catch (error) {
                console.error('Error loading notebook:', error);
            }
        };

        if (notebookName) {
            fetchNotebook();
        }
    }, [notebookName]);

    const handleMouseDown = (e) => {
        if (tool === 'pencil') {
            setIsDrawing(true);
            const pos = e.target.getStage().getPointerPosition();
            setCurrentLine([pos.x, pos.y]);
        }
    };

    const handleMouseUp = () => {
        if (tool === 'pencil') {
            setIsDrawing(false);
            setLines([...lines, currentLine]);
            setCurrentLine([]);
        }
    };

    const handleMouseMove = (e) => {
        if (isDrawing) {
            const pos = e.target.getStage().getPointerPosition();
            setCurrentLine([...currentLine, pos.x, pos.y]);
        }
    };

    const handleAddText = () => {
        if (textInput) {
            setTexts([...texts, { text: textInput, x: 50, y: 50 }]); // Set default position
            setTextInput('');
        }
    };

    return (
        <div>
            <div className="toolbar">
                <button onClick={() => setTool('pencil')}>Pencil</button>
                <button onClick={() => setTool('eraser')}>Eraser</button>
                <button onClick={() => setTool('text')}>Add Text</button>
                <input type="color" onChange={(e) => setColor(e.target.value)} />
                {tool === 'text' && (
                    <div>
                        <input
                            type="text"
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            placeholder="Enter text"
                        />
                        <button onClick={handleAddText}>Add</button>
                    </div>
                )}
            </div>
            <Stage
                width={800}
                height={600}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
            >
                <Layer>
                    {lines.map((line, index) => (
                        <Line
                            key={index}
                            points={line}
                            stroke={color}
                            strokeWidth={2}
                            lineCap="round"
                        />
                    ))}
                    {isDrawing && currentLine.length > 0 && (
                        <Line
                            points={currentLine}
                            stroke={color}
                            strokeWidth={2}
                            lineCap="round"
                        />
                    )}
                    {texts.map((text, index) => (
                        <Text key={index} text={text.text} x={text.x} y={text.y} fill={color} />
                    ))}
                </Layer>
            </Stage>
        </div>
    );
};

export default Canvas;
