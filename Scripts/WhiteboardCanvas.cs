using Godot;
using System;
using System.Collections.Generic;

public partial class Main : Node2D
{
	// Enum for selecting tools (Pencil, Eraser)
	public enum Tool
	{
		Pencil,
		Eraser
	}

	// Variables for tool settings
	private Tool currentTool = Tool.Pencil; // Default tool is pencil
	private Color currentColor = new Color(0, 0, 0); // Default color is black
	private float currentStrokeWidth = 5.0f; // Default stroke width

	// Drawing state
	private bool isDrawing = false;
	private Vector2 lastPosition;

	// For history (Undo/Redo)
	private List<List<DrawElement>> pages = new List<List<DrawElement>> { new List<DrawElement>() };
	private int currentPage = 0;
	private int historyStep = 0;

	// UI Elements
	private TextureRect canvasTextureRect;
	private ColorPicker colorPicker;
	private Slider strokeWidthSlider;
	private Button undoButton;
	private Button redoButton;
	private Button pencilButton;
	private Button eraserButton;

	// Class to represent drawing elements
	public class DrawElement
	{
		public Tool Tool;
		public List<Vector2> Points;
		public Color Color;
		public float StrokeWidth;
	}

	public override void _Ready()
	{
		// Get UI elements from the scene
		canvasTextureRect = GetNode<TextureRect>("CanvasTextureRect");

		colorPicker = GetNode<ColorPicker>("UI/ColorPicker");
		colorPicker.Color = currentColor;
		colorPicker.Connect("color_changed", this, nameof(OnColorChanged));

		strokeWidthSlider = GetNode<Slider>("UI/StrokeWidthSlider");
		strokeWidthSlider.Value = currentStrokeWidth;
		strokeWidthSlider.Connect("value_changed", this, nameof(OnStrokeWidthChanged));

		undoButton = GetNode<Button>("UI/UndoButton");
		undoButton.Connect("pressed", this, nameof(Undo));

		redoButton = GetNode<Button>("UI/RedoButton");
		redoButton.Connect("pressed", this, nameof(Redo));

		pencilButton = GetNode<Button>("UI/PencilButton");
		pencilButton.Connect("pressed", this, nameof(OnPencilSelected));

		eraserButton = GetNode<Button>("UI/EraserButton");
		eraserButton.Connect("pressed", this, nameof(OnEraserSelected));

		UpdateCanvas(); // Initialize the canvas
	}

	// Handle mouse input for drawing
	public override void _Input(InputEvent inputEvent)
	{
		if (inputEvent is InputEventMouseMotion motion)
		{
			if (isDrawing)
			{
				Vector2 currentPos = motion.Position;
				Draw(currentPos);
			}
		}
		else if (inputEvent is InputEventMouseButton button)
		{
			if (button.ButtonIndex == MouseButton.Left)
			{
				if (button.Pressed)
				{
					isDrawing = true;
					lastPosition = button.Position;
					OnMouseDown(button.Position);
				}
				else
				{
					isDrawing = false;
					OnMouseUp();
				}
			}
		}
	}

	// Called when the mouse is pressed down
	private void OnMouseDown(Vector2 position)
	{
		// Start a new drawing element
		if (currentTool == Tool.Pencil || currentTool == Tool.Eraser)
		{
			var newElement = new DrawElement
			{
				Tool = currentTool,
				Points = new List<Vector2> { position },
				Color = currentColor,
				StrokeWidth = currentStrokeWidth
			};
			pages[currentPage].Add(newElement);
		}

		UpdateCanvas();
	}

	// Called when the mouse is released
	private void OnMouseUp()
	{
		AddToHistory();
	}

	// Perform the drawing, adding points to the current drawing element
	private void Draw(Vector2 currentPos)
	{
		if (pages[currentPage].Count > 0 && pages[currentPage][pages[currentPage].Count - 1] is DrawElement lastElement && lastElement.Tool == currentTool)
		{
			lastElement.Points.Add(currentPos);
		}
		else
		{
			OnMouseDown(currentPos); // Start new stroke
		}

		UpdateCanvas();
	}

	// Update the canvas by drawing all elements in the current page
	private void UpdateCanvas()
	{
		var image = new Image();
		image.Create(800, 600, false, Image.Format.Rgba8);  // Create image of the size 800x600
		image.Fill(new Color(1, 1, 1));  // Fill with white background

		// Draw all the elements on the current page
		foreach (var element in pages[currentPage])
		{
			if (element.Tool == Tool.Pencil || element.Tool == Tool.Eraser)
			{
				for (int i = 1; i < element.Points.Count; i++)
				{
					var p1 = element.Points[i - 1];
					var p2 = element.Points[i];
					image.DrawLine(p1, p2, element.Color, element.StrokeWidth);
				}
			}
		}

		// Convert image to texture
		var texture = new ImageTexture();
		texture.CreateFromImage(image);
		canvasTextureRect.Texture = texture;
	}

	// Add the current page to history for undo/redo
	private void AddToHistory()
	{
		if (historyStep < pages.Count)
		{
			pages = pages.GetRange(0, historyStep + 1);  // Trim history
		}
		pages.Add(new List<DrawElement>(pages[currentPage])); // Save the current state
		historyStep++;
	}

	// Undo the last drawing action
	private void Undo()
	{
		if (historyStep > 0)
		{
			historyStep--;
			pages[currentPage] = new List<DrawElement>(pages[historyStep]);
			UpdateCanvas();
		}
	}

	// Redo the undone drawing action
	private void Redo()
	{
		if (historyStep < pages.Count - 1)
		{
			historyStep++;
			pages[currentPage] = new List<DrawElement>(pages[historyStep]);
			UpdateCanvas();
		}
	}

	// Change the drawing color
	private void OnColorChanged(Color newColor)
	{
		currentColor = newColor;
	}

	// Change the stroke width
	private void OnStrokeWidthChanged(float newWidth)
	{
		currentStrokeWidth = newWidth;
	}

	// Select the pencil tool
	private void OnPencilSelected()
	{
		currentTool = Tool.Pencil;
	}

	// Select the eraser tool
	private void OnEraserSelected()
	{
		currentTool = Tool.Eraser;
	}
}
