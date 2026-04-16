import { useState, useRef } from "react";

function App() {
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isQuerying, setIsQuerying] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://127.0.0.1:8001/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      setText(data.text);
      setDocumentId(data.document_id);
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleQuery = async () => {
    if (!documentId) {
      alert("Upload document first");
      return;
    }
    if (!query.trim()) {
      alert("Please enter a question");
      return;
    }

    setIsQuerying(true);
    try {
      const res = await fetch("http://127.0.0.1:8001/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: query,
          document_id: documentId,
        }),
      });

      if (!res.ok) throw new Error("Query failed");

      const data = await res.json();
      setAnswer(data.context);
    } catch (err) {
      console.error(err);
      alert("Query failed");
    } finally {
      setIsQuerying(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
      {/* Header */}
      <nav style={{ 
        background: "white", 
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        position: "sticky",
        top: 0,
        zIndex: 100
      }}>
        <div style={{ 
          maxWidth: "1200px", 
          margin: "0 auto", 
          padding: "1rem 2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{
              width: "40px",
              height: "40px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <span style={{ fontSize: "24px" }}>📄</span>
            </div>
            <h1 style={{ 
              fontSize: "1.5rem", 
              fontWeight: "bold",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}>
              DocuMind OCR
            </h1>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <span style={{ 
              width: "8px", 
              height: "8px", 
              background: "#10b981", 
              borderRadius: "50%",
              display: "inline-block"
            }}></span>
            <span style={{ color: "#6b7280", fontSize: "0.875rem" }}>System Ready</span>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
        {/* Upload Card */}
        <div style={{
          background: "white",
          borderRadius: "20px",
          boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
          marginBottom: "2rem",
          overflow: "hidden"
        }}>
          <div style={{
            padding: "1.5rem",
            borderBottom: "1px solid #e5e7eb",
            background: "#f9fafb"
          }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "600", color: "#374151" }}>
              📤 Upload Document
            </h2>
            <p style={{ color: "#6b7280", fontSize: "0.875rem", marginTop: "0.25rem" }}>
              Upload PDF, JPG, or PNG files for OCR processing
            </p>
          </div>

          <div style={{ padding: "2rem" }}>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${dragActive ? "#667eea" : "#d1d5db"}`,
                borderRadius: "12px",
                padding: "3rem 2rem",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.3s ease",
                background: dragActive ? "#f3f4ff" : "white",
                ...(file && { borderColor: "#10b981", background: "#f0fdf4" })
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                style={{ display: "none" }}
                accept=".pdf,.jpg,.jpeg,.png"
              />

              {!file ? (
                <>
                  <div style={{ fontSize: "48px", marginBottom: "1rem" }}>📁</div>
                  <p style={{ fontSize: "1.125rem", fontWeight: "500", color: "#374151", marginBottom: "0.5rem" }}>
                    Drop your file here or click to browse
                </p>
                  <p style={{ color: "#9ca3af", fontSize: "0.875rem" }}>
                    Supports PDF, JPG, PNG (Max 10MB)
                </p>
                </>
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ fontSize: "32px" }}>📄</div>
                    <div style={{ textAlign: "left" }}>
                      <p style={{ fontWeight: "500", color: "#374151" }}>{file.name}</p>
                      <p style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile();
                      }}
                      style={{
                        padding: "0.5rem 1rem",
                        background: "#ef4444",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "0.875rem"
                      }}
                      onMouseEnter={(e) => e.target.style.background = "#dc2626"}
                      onMouseLeave={(e) => e.target.style.background = "#ef4444"}
                    >
                      Remove
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpload();
                      }}
                      disabled={isUploading}
                      style={{
                        padding: "0.5rem 1rem",
                        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        cursor: isUploading ? "not-allowed" : "pointer",
                        fontSize: "0.875rem",
                        opacity: isUploading ? 0.6 : 1
                      }}
                    >
                      {isUploading ? "Processing..." : "Upload & Extract"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Extracted Text */}
        {text && (
          <div style={{
            background: "white",
            borderRadius: "20px",
            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
            marginBottom: "2rem",
            overflow: "hidden",
            animation: "slideIn 0.3s ease-out"
          }}>
            <div style={{
              padding: "1.5rem",
              borderBottom: "1px solid #e5e7eb",
              background: "#f9fafb"
            }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: "600", color: "#374151" }}>
                📝 Extracted Text
              </h2>
            </div>
            <div style={{ padding: "2rem" }}>
              <div style={{
                background: "#f9fafb",
                borderRadius: "8px",
                padding: "1.5rem",
                border: "1px solid #e5e7eb",
                maxHeight: "300px",
                overflow: "auto"
              }}>
                <p style={{ color: "#4b5563", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                  {text}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Query Section */}
        <div style={{
          background: "white",
          borderRadius: "20px",
          boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
          overflow: "hidden",
          opacity: text ? 1 : 0.7
        }}>
          <div style={{
            padding: "1.5rem",
            borderBottom: "1px solid #e5e7eb",
            background: "#f9fafb"
          }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "600", color: "#374151" }}>
              💬 Ask Questions
            </h2>
            <p style={{ color: "#6b7280", fontSize: "0.875rem", marginTop: "0.25rem" }}>
              Get answers from your document using AI
            </p>
          </div>

          <div style={{ padding: "2rem" }}>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <input
                type="text"
                placeholder="e.g., What is this document about?"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleQuery()}
                disabled={!text || isQuerying}
                style={{
                  flex: 1,
                  padding: "0.75rem 1rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  outline: "none",
                  transition: "all 0.3s",
                  ...(!text && { background: "#f3f4f6", cursor: "not-allowed" })
                }}
                onFocus={(e) => e.target.style.borderColor = "#667eea"}
                onBlur={(e) => e.target.style.borderColor = "#d1d5db"}
              />
              <button
                onClick={handleQuery}
                disabled={!text || isQuerying || !query.trim()}
                style={{
                  padding: "0.75rem 2rem",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  fontWeight: "500",
                  cursor: (!text || isQuerying || !query.trim()) ? "not-allowed" : "pointer",
                  transition: "transform 0.2s",
                  opacity: (!text || isQuerying || !query.trim()) ? 0.6 : 1
                }}
                onMouseEnter={(e) => {
                  if (text && query.trim() && !isQuerying) {
                    e.target.style.transform = "translateY(-2px)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0)";
                }}
              >
                {isQuerying ? "Thinking..." : "Ask AI"}
              </button>
            </div>

            {/* Answer Section */}
            {answer && (
              <div style={{
                marginTop: "2rem",
                padding: "1.5rem",
                background: "linear-gradient(135deg, #f3f4ff 0%, #fce7f3 100%)",
                borderRadius: "12px",
                border: "1px solid #e0e7ff",
                animation: "slideIn 0.3s ease-out"
              }}>
                <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                  <div style={{
                    width: "40px",
                    height: "40px",
                    background: "white",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px"
                  }}>
                    🤖
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontWeight: "600", color: "#374151", marginBottom: "0.5rem" }}>Answer</h3>
                    <p style={{ color: "#4b5563", lineHeight: "1.6" }}>{answer}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer style={{
          marginTop: "3rem",
          paddingTop: "2rem",
          borderTop: "1px solid rgba(255,255,255,0.2)",
          textAlign: "center",
          color: "white"
        }}>
          <p>Powered by OCR + RAG Technology | Secure Document Processing</p>
        </footer>
      </div>

      <style>
        {`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          }
          
          @media (max-width: 768px) {
            div[style*="max-width: 1200px"] {
              padding: 1rem !important;
            }
          }
        `}
      </style>
    </div>
  );
}

export default App;