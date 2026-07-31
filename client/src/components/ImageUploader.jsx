import { useRef, useState } from "react";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 10 * 1024 * 1024;

export default function ImageUploader({ onFileSelect, previewUrl, disabled }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState("");

  function handleFiles(files) {
    const file = files?.[0];
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setLocalError("JPEG, PNG, WebP 형식의 이미지만 업로드할 수 있습니다.");
      return;
    }
    if (file.size > MAX_SIZE) {
      setLocalError("파일 크기는 10MB를 넘을 수 없습니다.");
      return;
    }
    setLocalError("");
    onFileSelect(file);
  }

  return (
    <div className="uploader">
      <div
        className={`dropzone ${dragOver ? "dropzone--active" : ""}`}
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!disabled) handleFiles(e.dataTransfer.files);
        }}
      >
        {previewUrl ? (
          <div className="preview-wrap">
            <img src={previewUrl} alt="업로드된 냉장고 사진 미리보기" className="preview-img" />
            <p className="preview-caption">📷 다른 사진으로 바꾸려면 클릭하거나 새 사진을 끓어다 놓으세요</p>
          </div>
        ) : (
          <div className="dropzone-placeholder">
            <span className="dropzone-icon" aria-hidden="true">
              {dragOver ? "📥" : "🥬"}
            </span>
            <p>냉장고 사진을 여기에 끓어다 놓거나 클릭해서 업로드하세요</p>
            <p className="dropzone-hint">JPEG / PNG / WebP, 최대 10MB</p>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: "none" }}
        disabled={disabled}
        onChange={(e) => handleFiles(e.target.files)}
      />
      {localError && <p className="error-text">{localError}</p>}
    </div>
  );
}
