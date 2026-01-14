import { useState, useRef, useEffect } from 'react';

/**
 * Interactive image cloze editor
 * Allows drawing, moving, and resizing rectangles over an image
 */
function ImageClozeEditor({ imageData, clozes, onChange }) {
  const [rectangles, setRectangles] = useState(clozes || []);
  const [isDrawing, setIsDrawing] = useState(false);
  const [dragState, setDragState] = useState(null); // {type: 'move'|'resize', id, startX, startY, handle}
  const [currentRect, setCurrentRect] = useState(null);
  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Update parent when rectangles change
  useEffect(() => {
    if (onChange) {
      onChange(rectangles);
    }
  }, [rectangles]);

  // Track container size for coordinate conversion
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const img = containerRef.current.querySelector('img');
        if (img) {
          setContainerSize({
            width: img.offsetWidth,
            height: img.offsetHeight,
          });
        }
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [imageData]);

  const getRelativeCoords = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
  };

  const handleMouseDown = (e) => {
    // Only start drawing if clicking on the container or image, not on existing rectangles
    if (e.target === containerRef.current || e.target.classList.contains('image-display')) {
      // Start drawing new rectangle
      const { x, y } = getRelativeCoords(e);
      setIsDrawing(true);
      setCurrentRect({ x, y, width: 0, height: 0 });
    }
  };

  const handleMouseMove = (e) => {
    if (isDrawing && currentRect) {
      const { x, y } = getRelativeCoords(e);
      setCurrentRect({
        x: Math.min(currentRect.x, x),
        y: Math.min(currentRect.y, y),
        width: Math.abs(x - currentRect.x),
        height: Math.abs(y - currentRect.y),
      });
    } else if (dragState) {
      const { x, y } = getRelativeCoords(e);
      const deltaX = x - dragState.startX;
      const deltaY = y - dragState.startY;

      if (dragState.type === 'move') {
        // Move rectangle
        setRectangles((prev) =>
          prev.map((rect) =>
            rect.id === dragState.id
              ? {
                  ...rect,
                  x: Math.max(0, Math.min(100 - rect.width, rect.x + deltaX)),
                  y: Math.max(0, Math.min(100 - rect.height, rect.y + deltaY)),
                }
              : rect
          )
        );
        setDragState({ ...dragState, startX: x, startY: y });
      } else if (dragState.type === 'resize') {
        // Resize rectangle
        setRectangles((prev) =>
          prev.map((rect) => {
            if (rect.id !== dragState.id) return rect;

            const handle = dragState.handle;
            let newRect = { ...rect };

            if (handle.includes('e')) {
              newRect.width = Math.max(5, Math.min(100 - rect.x, rect.width + deltaX));
            }
            if (handle.includes('w')) {
              const newX = Math.max(0, Math.min(rect.x + rect.width - 5, rect.x + deltaX));
              newRect.width = rect.width + (rect.x - newX);
              newRect.x = newX;
            }
            if (handle.includes('s')) {
              newRect.height = Math.max(5, Math.min(100 - rect.y, rect.height + deltaY));
            }
            if (handle.includes('n')) {
              const newY = Math.max(0, Math.min(rect.y + rect.height - 5, rect.y + deltaY));
              newRect.height = rect.height + (rect.y - newY);
              newRect.y = newY;
            }

            return newRect;
          })
        );
        setDragState({ ...dragState, startX: x, startY: y });
      }
    }
  };

  const handleMouseUp = () => {
    if (isDrawing && currentRect && currentRect.width > 1 && currentRect.height > 1) {
      // Add new rectangle
      setRectangles([
        ...rectangles,
        {
          ...currentRect,
          id: Date.now(),
        },
      ]);
    }
    setIsDrawing(false);
    setCurrentRect(null);
    setDragState(null);
  };

  const startDrag = (e, id, type, handle = null) => {
    e.stopPropagation();
    const { x, y } = getRelativeCoords(e);
    setDragState({ type, id, startX: x, startY: y, handle });
  };

  const deleteRectangle = (id) => {
    setRectangles(rectangles.filter((r) => r.id !== id));
  };

  return (
    <div>
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          display: 'inline-block',
          cursor: isDrawing ? 'crosshair' : 'default',
          userSelect: 'none',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img
          src={imageData}
          alt="Snippet"
          className="image-display"
          style={{
            maxWidth: '100%',
            maxHeight: '500px',
            display: 'block',
            pointerEvents: 'none',
          }}
        />

        {/* Render existing rectangles */}
        {rectangles.map((rect) => (
          <Rectangle
            key={rect.id}
            rect={rect}
            onStartDrag={(e, type, handle) => startDrag(e, rect.id, type, handle)}
            onDelete={() => deleteRectangle(rect.id)}
          />
        ))}

        {/* Render current drawing rectangle */}
        {currentRect && currentRect.width > 0 && currentRect.height > 0 && (
          <div
            style={{
              position: 'absolute',
              left: `${currentRect.x}%`,
              top: `${currentRect.y}%`,
              width: `${currentRect.width}%`,
              height: `${currentRect.height}%`,
              backgroundColor: 'rgba(211, 211, 211, 0.7)',
              border: '3px solid #4a5568',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>

      <div style={{ marginTop: '10px', fontSize: '14px', color: 'var(--text-secondary)' }}>
        <p style={{ margin: '5px 0' }}>
          <strong>Draw:</strong> Click and drag on image to create rectangles
        </p>
        <p style={{ margin: '5px 0' }}>
          <strong>Move:</strong> Drag rectangles to reposition
        </p>
        <p style={{ margin: '5px 0' }}>
          <strong>Resize:</strong> Drag corners or edges
        </p>
        <p style={{ margin: '5px 0' }}>
          <strong>Delete:</strong> Click × on rectangle
        </p>
        <p style={{ margin: '5px 0', color: 'var(--text-primary)' }}>
          {rectangles.length} cloze{rectangles.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}

/**
 * Individual rectangle component with resize handles
 */
function Rectangle({ rect, onStartDrag, onDelete }) {
  const [isHovered, setIsHovered] = useState(false);

  const handleStyle = {
    position: 'absolute',
    width: '12px',
    height: '12px',
    backgroundColor: '#4a5568',
    border: '2px solid white',
    borderRadius: '50%',
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: `${rect.x}%`,
        top: `${rect.y}%`,
        width: `${rect.width}%`,
        height: `${rect.height}%`,
        backgroundColor: 'rgba(211, 211, 211, 0.7)',
        border: '3px solid #4a5568',
        cursor: 'move',
        boxSizing: 'border-box',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={(e) => onStartDrag(e, 'move')}
    >
      {/* Delete button */}
      {isHovered && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          style={{
            position: 'absolute',
            top: '-10px',
            right: '-10px',
            width: '24px',
            height: '24px',
            backgroundColor: 'var(--again-red)',
            color: 'white',
            border: '2px solid white',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            zIndex: 10,
          }}
        >
          ×
        </button>
      )}

      {/* Resize handles */}
      {isHovered && (
        <>
          {/* Corners */}
          <div
            style={{ ...handleStyle, top: '-6px', left: '-6px', cursor: 'nw-resize' }}
            onMouseDown={(e) => onStartDrag(e, 'resize', 'nw')}
          />
          <div
            style={{ ...handleStyle, top: '-6px', right: '-6px', cursor: 'ne-resize' }}
            onMouseDown={(e) => onStartDrag(e, 'resize', 'ne')}
          />
          <div
            style={{ ...handleStyle, bottom: '-6px', left: '-6px', cursor: 'sw-resize' }}
            onMouseDown={(e) => onStartDrag(e, 'resize', 'sw')}
          />
          <div
            style={{ ...handleStyle, bottom: '-6px', right: '-6px', cursor: 'se-resize' }}
            onMouseDown={(e) => onStartDrag(e, 'resize', 'se')}
          />

          {/* Edges */}
          <div
            style={{
              ...handleStyle,
              top: '-6px',
              left: '50%',
              transform: 'translateX(-50%)',
              cursor: 'n-resize',
            }}
            onMouseDown={(e) => onStartDrag(e, 'resize', 'n')}
          />
          <div
            style={{
              ...handleStyle,
              bottom: '-6px',
              left: '50%',
              transform: 'translateX(-50%)',
              cursor: 's-resize',
            }}
            onMouseDown={(e) => onStartDrag(e, 'resize', 's')}
          />
          <div
            style={{
              ...handleStyle,
              left: '-6px',
              top: '50%',
              transform: 'translateY(-50%)',
              cursor: 'w-resize',
            }}
            onMouseDown={(e) => onStartDrag(e, 'resize', 'w')}
          />
          <div
            style={{
              ...handleStyle,
              right: '-6px',
              top: '50%',
              transform: 'translateY(-50%)',
              cursor: 'e-resize',
            }}
            onMouseDown={(e) => onStartDrag(e, 'resize', 'e')}
          />
        </>
      )}
    </div>
  );
}

export default ImageClozeEditor;
