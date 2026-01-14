/**
 * Display image with optional cloze rectangles overlay
 * Used in review mode to hide/show parts of the image
 */
function ImageWithClozes({ imageData, clozes, hideClozes, alt, style }) {
  if (!imageData) return null;

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <img
        src={imageData}
        alt={alt || 'Snippet image'}
        style={style}
      />

      {/* Overlay cloze rectangles */}
      {hideClozes && clozes && clozes.length > 0 && (
        <>
          {clozes.map((rect) => (
            <div
              key={rect.id}
              style={{
                position: 'absolute',
                left: `${rect.x}%`,
                top: `${rect.y}%`,
                width: `${rect.width}%`,
                height: `${rect.height}%`,
                backgroundColor: '#d3d3d3',
                border: '3px solid #4a5568',
                pointerEvents: 'none',
              }}
            />
          ))}
        </>
      )}
    </div>
  );
}

export default ImageWithClozes;
