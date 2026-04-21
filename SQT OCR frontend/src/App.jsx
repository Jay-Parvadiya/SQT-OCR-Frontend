import { useState, useRef, useEffect } from "react";

// Simple emoji icons
const UploadIcon = () => <span style={{ fontSize: "20px" }}>📤</span>;
const FileTextIcon = () => <span style={{ fontSize: "20px" }}>📄</span>;
const SendIcon = () => <span style={{ fontSize: "18px" }}>📨</span>;
const TrashIcon = () => <span style={{ fontSize: "18px" }}>🗑️</span>;
const LoaderIcon = () => <span style={{ fontSize: "18px" }}>⏳</span>;
const CheckIcon = () => <span style={{ fontSize: "18px" }}>✓</span>;
const SparklesIcon = () => <span style={{ fontSize: "20px" }}>✨</span>;
const BrainIcon = () => <span style={{ fontSize: "20px" }}>🧠</span>;
const DatabaseIcon = () => <span style={{ fontSize: "16px" }}>🗄️</span>;
const CloseIcon = () => <span style={{ fontSize: "20px" }}>✕</span>;
const HistoryIcon = () => <span style={{ fontSize: "20px" }}>📜</span>;
const LoadIcon = () => <span style={{ fontSize: "16px" }}>🔄</span>;

function App() {
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isQuerying, setIsQuerying] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [documents, setDocuments] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(true);
  const fileInputRef = useRef(null);
  const answerRef = useRef(null);

  // Auto-scroll to answer when it appears
  useEffect(() => {
    if (answer && answerRef.current) {
      answerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [answer]);

  // Load document history on component mount
  useEffect(() => {
    loadDocumentHistory();
  }, []);

  // Show toast notification
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 4000);
  };

  // Load document history from backend
  const loadDocumentHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch("http://127.0.0.1:8001/documents");
      if (!res.ok) throw new Error("Failed to load documents");
      const data = await res.json();
      setDocuments(data);
    } catch (err) {
      console.error(err);
      showToast("Failed to load document history", "error");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Load a specific document by ID
  const loadDocument = async (docId, filename) => {
    try {
      const res = await fetch(`http://127.0.0.1:8001/documents/${docId}/preview`);
      if (!res.ok) throw new Error("Failed to load document");
      const data = await res.json();
      
      if (data.error) {
        showToast(data.error, "error");
        return;
      }
      
      setText(data.content);
      setDocumentId(docId);
      setAnswer("");
      setQuery("");
      showToast(`Loaded: ${filename}`, "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to load document content", "error");
    }
  };

  // Delete document from history
  const deleteDocument = async (docId, filename, e) => {
    e.stopPropagation();
    // Note: Add a delete endpoint in your backend if needed
    showToast(`Delete endpoint not implemented yet`, "info");
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const validTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
      const maxSize = 10 * 1024 * 1024;

      if (!validTypes.includes(selectedFile.type)) {
        showToast("Please upload PDF, JPG, or PNG files only", "error");
        return;
      }

      if (selectedFile.size > maxSize) {
        showToast("File size must be less than 10MB", "error");
        return;
      }

      setFile(selectedFile);
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
      const droppedFile = e.dataTransfer.files[0];
      const validTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];

      if (!validTypes.includes(droppedFile.type)) {
        showToast("Please upload PDF, JPG, or PNG files only", "error");
        return;
      }

      setFile(droppedFile);
    }
  };

  const simulateProgress = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);
    return interval;
  };

  const handleUpload = async () => {
    if (!file) {
      showToast("Please select a file first", "error");
      return;
    }

    setIsUploading(true);
    const progressInterval = simulateProgress();

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://127.0.0.1:8001/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      setText(data.text);
      setDocumentId(data.document_id);
      showToast("Document uploaded and processed successfully!", "success");
      
      // Refresh document history after upload
      await loadDocumentHistory();
    } catch (err) {
      console.error(err);
      showToast("Upload failed. Please make sure the backend server is running.", "error");
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  };

  const handleQuery = async () => {
    if (!documentId) {
      showToast("Please upload or load a document first", "error");
      return;
    }
    if (!query.trim()) {
      showToast("Please enter a question", "error");
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
      showToast("Query failed. Please try again.", "error");
    } finally {
      setIsQuerying(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const clearAll = () => {
    setFile(null);
    setText("");
    setQuery("");
    setAnswer("");
    setDocumentId("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    showToast("All data cleared", "info");
  };

  const getFileIcon = () => {
    if (!file) return <span style={{ fontSize: "48px" }}>📁</span>;
    if (file.type === "application/pdf") return <span style={{ fontSize: "48px" }}>📑</span>;
    return <span style={{ fontSize: "48px" }}>🖼️</span>;
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
      {/* Toast Notification */}
      {toast.show && (
        <div
          style={{
            position: "fixed",
            top: "90px",
            right: "24px",
            zIndex: 1000,
            animation: "slideInRight 0.3s ease",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 20px",
              background: toast.type === "success" ? "#10b981" : toast.type === "error" ? "#ef4444" : "#3b82f6",
              borderRadius: "12px",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
              fontSize: "0.875rem",
              fontWeight: "500",
              color: "white",
            }}
          >
            {toast.type === "success" && <CheckIcon />}
            {toast.type === "error" && <CloseIcon />}
            {toast.type === "info" && <SparklesIcon />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <nav
        style={{
          background: "rgba(255, 255, 255, 0.98)",
          backdropFilter: "blur(10px)",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
          position: "sticky",
          top: 0,
          zIndex: 100,
          borderBottom: "1px solid rgba(0, 0, 0, 0.05)",
        }}
      >
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 2rem" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "1rem 0",
              flexWrap: "wrap",
              gap: "1rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                }}
              >
                <BrainIcon />
              </div>
              <h1
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "700",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                DocuMind <span style={{ fontWeight: "800" }}>OCR</span>
              </h1>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 1rem",
                background: "#f1f5f9",
                borderRadius: "40px",
                fontSize: "0.875rem",
                color: "#475569",
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  background: "#10b981",
                  borderRadius: "50%",
                  animation: "pulse 2s infinite",
                }}
              ></span>
              <span>System Ready</span>
            </div>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "2rem", display: "flex", gap: "2rem" }}>
        {/* Sidebar - Document History */}
        <div
          style={{
            width: showHistory ? "320px" : "60px",
            background: "white",
            borderRadius: "24px",
            boxShadow: "0 20px 35px -10px rgba(0, 0, 0, 0.1)",
            height: "fit-content",
            transition: "width 0.3s ease",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "1.5rem",
              borderBottom: "1px solid #e2e8f0",
              background: "#fafbff",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
            }}
            onClick={() => setShowHistory(!showHistory)}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <HistoryIcon />
              {showHistory && <h3 style={{ fontSize: "1rem", fontWeight: "600", color: "#1e293b" }}>History</h3>}
            </div>
            <span style={{ fontSize: "12px", color: "#64748b" }}>{showHistory ? "◀" : "▶"}</span>
          </div>
          
          {showHistory && (
            <div style={{ padding: "1rem" }}>
              <button
                onClick={loadDocumentHistory}
                disabled={isLoadingHistory}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  cursor: isLoadingHistory ? "not-allowed" : "pointer",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  marginBottom: "1rem",
                }}
              >
                {isLoadingHistory ? <LoaderIcon /> : <LoadIcon />}
                Refresh History
              </button>
              
              <div style={{ maxHeight: "500px", overflowY: "auto" }}>
                {documents.length === 0 ? (
                  <p style={{ textAlign: "center", color: "#94a3b8", padding: "2rem 0" }}>
                    No documents yet
                  </p>
                ) : (
                  documents.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => loadDocument(doc.id, doc.filename)}
                      style={{
                        padding: "0.75rem",
                        marginBottom: "0.5rem",
                        background: documentId === doc.id ? "#f1f5ff" : "#f8fafc",
                        borderRadius: "12px",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        border: documentId === doc.id ? "1px solid #667eea" : "1px solid #e2e8f0",
                      }}
                      onMouseEnter={(e) => {
                        if (documentId !== doc.id) e.currentTarget.style.background = "#f1f5f9";
                      }}
                      onMouseLeave={(e) => {
                        if (documentId !== doc.id) e.currentTarget.style.background = "#f8fafc";
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <FileTextIcon />
                        <div style={{ flex: 1, overflow: "hidden" }}>
                          <p
                            style={{
                              fontSize: "0.875rem",
                              fontWeight: documentId === doc.id ? "600" : "500",
                              color: "#1e293b",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {doc.filename}
                          </p>
                          <p style={{ fontSize: "0.7rem", color: "#64748b" }}>ID: {doc.id}</p>
                        </div>
                        {documentId === doc.id && (
                          <span style={{ fontSize: "12px", color: "#667eea" }}>✓</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div style={{ flex: 1 }}>
          {/* Hero Section */}
          <div style={{ textAlign: "center", padding: "0 0 2rem 0" }}>
            <h2
              style={{
                fontSize: "2rem",
                fontWeight: "800",
                background: "linear-gradient(135deg, #fff 0%, #e0e7ff 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                marginBottom: "0.5rem",
              }}
            >
              Extract. Analyze. Understand.
            </h2>
            <p
              style={{
                fontSize: "1rem",
                color: "rgba(255, 255, 255, 0.9)",
                maxWidth: "600px",
                margin: "0 auto",
              }}
            >
              Upload any document and let AI extract text and answer your questions
            </p>
          </div>

          {/* Upload Card */}
          <div
            style={{
              background: "white",
              borderRadius: "24px",
              boxShadow: "0 20px 35px -10px rgba(0, 0, 0, 0.1)",
              marginBottom: "2rem",
              overflow: "hidden",
              transition: "transform 0.3s ease, box-shadow 0.3s ease",
            }}
          >
            <div
              style={{
                padding: "1.5rem",
                borderBottom: "1px solid #e2e8f0",
                background: "#fafbff",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  background: "linear-gradient(135deg, #667eea20 0%, #764ba220 100%)",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#667eea",
                }}
              >
                <UploadIcon />
              </div>
              <div>
                <h3 style={{ fontSize: "1.125rem", fontWeight: "600", color: "#1e293b" }}>
                  Upload Document
                </h3>
                <p style={{ fontSize: "0.875rem", color: "#64748b", marginTop: "0.25rem" }}>
                  Support for PDF, JPG, PNG files up to 10MB
                </p>
              </div>
            </div>

            <div
              className="drop-zone"
              onClick={() => fileInputRef.current?.click()}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${dragActive ? "#667eea" : file ? "#10b981" : "#cbd5e1"}`,
                borderRadius: "16px",
                padding: "2rem",
                margin: "1.5rem",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.3s ease",
                background: dragActive ? "#f1f5ff" : file ? "#f0fdf4" : "#ffffff",
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
                  <div style={{ marginBottom: "1rem" }}>{getFileIcon()}</div>
                  <p style={{ fontSize: "1rem", fontWeight: "500", color: "#334155", marginBottom: "0.5rem" }}>
                    Drop your file here or click to browse
                  </p>
                  <p style={{ fontSize: "0.875rem", color: "#94a3b8" }}>PDF, JPG or PNG (Max 10MB)</p>
                </>
              ) : (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "1rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ fontSize: "32px" }}>{getFileIcon()}</div>
                    <div>
                      <p style={{ fontWeight: "500", color: "#1e293b" }}>{file.name}</p>
                      <p style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
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
                        background: "#fee2e2",
                        color: "#dc2626",
                        border: "none",
                        borderRadius: "10px",
                        cursor: "pointer",
                        fontSize: "0.875rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => (e.target.style.background = "#fecaca")}
                      onMouseLeave={(e) => (e.target.style.background = "#fee2e2")}
                    >
                      <TrashIcon />
                      Remove
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpload();
                      }}
                      disabled={isUploading}
                      style={{
                        padding: "0.5rem 1.25rem",
                        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        color: "white",
                        border: "none",
                        borderRadius: "10px",
                        cursor: isUploading ? "not-allowed" : "pointer",
                        fontSize: "0.875rem",
                        fontWeight: "500",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        opacity: isUploading ? 0.7 : 1,
                        transition: "all 0.2s",
                      }}
                    >
                      {isUploading ? (
                        <>
                          <LoaderIcon />
                          Processing... {uploadProgress}%
                        </>
                      ) : (
                        <>
                          <UploadIcon />
                          Upload & Extract
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {isUploading && (
              <div
                style={{
                  height: "4px",
                  background: "#e2e8f0",
                  margin: "0 1.5rem 1.5rem",
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    borderRadius: "4px",
                    transition: "width 0.3s ease",
                    width: `${uploadProgress}%`,
                  }}
                ></div>
              </div>
            )}
          </div>

          {/* Active Document Indicator */}
          {documentId && (
            <div
              style={{
                background: "white",
                borderRadius: "16px",
                padding: "0.75rem 1.5rem",
                marginBottom: "1.5rem",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
              }}
            >
              <span style={{ fontSize: "20px" }}>📄</span>
              <span style={{ color: "#64748b", fontSize: "0.875rem" }}>Active Document:</span>
              <span style={{ fontWeight: "600", color: "#1e293b", fontSize: "0.875rem" }}>
                ID: {documentId}
              </span>
            </div>
          )}

          {/* Extracted Text Section */}
          {text && (
            <div
              style={{
                background: "white",
                borderRadius: "24px",
                boxShadow: "0 20px 35px -10px rgba(0, 0, 0, 0.1)",
                marginBottom: "2rem",
                overflow: "hidden",
                animation: "slideIn 0.4s ease-out",
              }}
            >
              <div
                style={{
                  padding: "1.5rem",
                  borderBottom: "1px solid #e2e8f0",
                  background: "#fafbff",
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    background: "linear-gradient(135deg, #667eea20 0%, #764ba220 100%)",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#667eea",
                  }}
                >
                  <FileTextIcon />
                </div>
                <div>
                  <h3 style={{ fontSize: "1.125rem", fontWeight: "600", color: "#1e293b" }}>
                    Extracted Text
                  </h3>
                  <p style={{ fontSize: "0.875rem", color: "#64748b", marginTop: "0.25rem" }}>
                    OCR processed content from your document
                  </p>
                </div>
              </div>
              <div
                style={{
                  padding: "1.5rem",
                  background: "#f8fafc",
                  margin: "1.5rem",
                  borderRadius: "16px",
                  border: "1px solid #e2e8f0",
                  maxHeight: "300px",
                  overflow: "auto",
                }}
              >
                <pre
                  style={{
                    fontFamily: "'Inter', monospace",
                    fontSize: "0.875rem",
                    lineHeight: "1.6",
                    color: "#334155",
                    whiteSpace: "pre-wrap",
                    wordWrap: "break-word",
                  }}
                >
                  {text}
                </pre>
              </div>
            </div>
          )}

          {/* Query Section */}
          {text && (
            <div
              style={{
                background: "white",
                borderRadius: "24px",
                boxShadow: "0 20px 35px -10px rgba(0, 0, 0, 0.1)",
                marginBottom: "2rem",
                overflow: "hidden",
                animation: "slideIn 0.4s ease-out",
              }}
            >
              <div
                style={{
                  padding: "1.5rem",
                  borderBottom: "1px solid #e2e8f0",
                  background: "#fafbff",
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    background: "linear-gradient(135deg, #667eea20 0%, #764ba220 100%)",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#667eea",
                  }}
                >
                  <SparklesIcon />
                </div>
                <div>
                  <h3 style={{ fontSize: "1.125rem", fontWeight: "600", color: "#1e293b" }}>
                    Ask Questions
                  </h3>
                  <p style={{ fontSize: "0.875rem", color: "#64748b", marginTop: "0.25rem" }}>
                    Get AI-powered answers from your document
                  </p>
                </div>
              </div>

              <div style={{ padding: "1.5rem" }}>
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                  <input
                    type="text"
                    placeholder="e.g., What is the main topic of this document?"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleQuery()}
                    disabled={isQuerying}
                    style={{
                      flex: 1,
                      padding: "0.875rem 1.25rem",
                      border: "2px solid #e2e8f0",
                      borderRadius: "14px",
                      fontSize: "1rem",
                      outline: "none",
                      transition: "all 0.3s",
                      fontFamily: "inherit",
                      background: isQuerying ? "#f1f5f9" : "white",
                      color: "#1e293b",
                      fontWeight: "400",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#667eea")}
                    onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                  />
                  <button
                    onClick={handleQuery}
                    disabled={!query.trim() || isQuerying}
                    style={{
                      padding: "0.875rem 2rem",
                      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      color: "white",
                      border: "none",
                      borderRadius: "14px",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      cursor: !query.trim() || isQuerying ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      transition: "all 0.2s",
                      opacity: !query.trim() || isQuerying ? 0.6 : 1,
                    }}
                  >
                    {isQuerying ? (
                      <>
                        <LoaderIcon />
                        Thinking...
                      </>
                    ) : (
                      <>
                        <SendIcon />
                        Ask AI
                      </>
                    )}
                  </button>
                </div>

                {answer && (
                  <div
                    ref={answerRef}
                    style={{
                      marginTop: "1.5rem",
                      padding: "1.5rem",
                      background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                      borderRadius: "20px",
                      border: "1px solid #e2e8f0",
                      animation: "slideIn 0.4s ease-out",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          background: "white",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1.25rem",
                        }}
                      >
                        🤖
                      </div>
                      <h4 style={{ fontSize: "1rem", fontWeight: "600", color: "#1e293b" }}>AI Answer</h4>
                    </div>
                    <p style={{ color: "#1e293b", lineHeight: "1.7", fontSize: "0.95rem", fontWeight: "400" }}>
                      {answer}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Clear Button */}
          {text && (
            <div style={{ textAlign: "center", margin: "2rem 0" }}>
              <button
                onClick={clearAll}
                style={{
                  padding: "0.75rem 1.5rem",
                  background: "rgba(255, 255, 255, 0.2)",
                  backdropFilter: "blur(10px)",
                  color: "white",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  borderRadius: "40px",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => (e.target.style.background = "rgba(255, 255, 255, 0.3)")}
                onMouseLeave={(e) => (e.target.style.background = "rgba(255, 255, 255, 0.2)")}
              >
                <TrashIcon />
                Clear All Data
              </button>
            </div>
          )}

          {/* Footer */}
          <footer style={{ textAlign: "center", padding: "2rem 0 1rem", color: "rgba(255, 255, 255, 0.8)", fontSize: "0.875rem" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "2rem",
                marginBottom: "1rem",
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}>
                <DatabaseIcon />
                <span>Secure Processing</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}>
                <BrainIcon />
                <span>AI-Powered RAG</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}>
                <FileTextIcon />
                <span>OCR Technology</span>
              </div>
            </div>
            <p>© 2024 DocuMind OCR | All rights reserved</p>
          </footer>
        </div>
      </div>

      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes slideInRight {
            from {
              opacity: 0;
              transform: translateX(100px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #f8fafc;
          }
          
          .drop-zone:hover {
            transform: scale(0.98);
          }
          
          input::placeholder {
            color: #94a3b8;
          }
          
          ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
          
          ::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 10px;
          }
          
          ::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 10px;
          }
          
          ::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }
          
          @media (max-width: 768px) {
            div[style*="display: flex"][style*="gap: 2rem"] {
              flex-direction: column !important;
            }
            
            .drop-zone {
              margin: 1rem !important;
              padding: 1.5rem !important;
            }
          }
        `}
      </style>
    </div>
  );
}

export default App;