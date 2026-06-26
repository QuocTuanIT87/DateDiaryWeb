import React, { useState, useEffect, useRef } from "react";
import { AsyncStorageService, type DateHistory, type DateType } from "../services/AsyncStorageService";
import { GoogleDriveService } from "../services/GoogleDriveService";
import { formatDateTime } from "../utils/dateUtils";
import { LazyImage } from "../components/LazyImage";
import { CustomAlert } from "../components/CustomAlert";
import { 
  IoEllipsisHorizontalOutline, 
  IoChatboxEllipsesOutline, 
  IoAddOutline, 
  IoCloseOutline,
  IoChevronBackOutline,
  IoChevronForwardOutline,
  IoTrashOutline,
  IoCreateOutline
} from "react-icons/io5";

export const AddEventView: React.FC = () => {
  const [history, setHistory] = useState<DateHistory[]>([]);
  const [allHistory, setAllHistory] = useState<DateHistory[]>([]);
  const [displayLimit, setDisplayLimit] = useState(20);
  const [types, setTypes] = useState<DateType[]>([]);
  const [loading, setLoading] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [datetime, setDatetime] = useState(""); // YYYY-MM-DDTHH:MM local format
  const [selectedType, setSelectedType] = useState("");
  const [note, setNote] = useState("");
  const [imageList, setImageList] = useState<string[]>([]);
  const [reason, setReason] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [removedImages, setRemovedImages] = useState<string[]>([]);

  // 3-dots actions menu modal
  const [menuEvent, setMenuEvent] = useState<DateHistory | null>(null);

  // Lightbox Viewer
  const [viewerImages, setViewerImages] = useState<string[]>([]);
  const [viewerIndex, setViewerIndex] = useState<number>(0);
  const [showViewer, setShowViewer] = useState<boolean>(false);

  // Reference for file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load category and history list
  const loadData = async (preserveLimit = false) => {
    try {
      setLoading(true);
      const list = await AsyncStorageService.getHistory();
      const loadedTypes = await AsyncStorageService.getTypes();
      
      const isConnected = await GoogleDriveService.isLoggedIn();
      setGoogleConnected(isConnected);

      // Sort by time descending (newest first)
      const sorted = list.sort((a, b) => {
        return new Date(b.time).getTime() - new Date(a.time).getTime();
      });

      setAllHistory(sorted);
      setTypes(loadedTypes);

      const limit = preserveLimit ? displayLimit : 20;
      if (!preserveLimit) {
        setDisplayLimit(20);
      }
      setHistory(sorted.slice(0, limit));

      if (loadedTypes.length > 0 && !selectedType) {
        setSelectedType(loadedTypes[0].name);
      }
    } catch (error) {
      console.error(error);
      CustomAlert.alert("Lỗi", "Không thể tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLoadMore = () => {
    if (history.length >= allHistory.length) return;
    const newLimit = displayLimit + 20;
    setDisplayLimit(newLimit);
    setHistory(allHistory.slice(0, newLimit));
  };

  // Image Selection
  const handleTriggerFileInput = () => {
    if (!googleConnected) {
      CustomAlert.alert(
        "Chưa kết nối Google Drive",
        "Hình ảnh cần được lưu trữ trên Google Drive của bạn. Vui lòng vào mục Cài đặt để kết nối tài khoản Google trước."
      );
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const newUrls = files.map(file => URL.createObjectURL(file));
      setImageList(prev => [...prev, ...newUrls]);
    }
  };

  const handleRemoveImage = (index: number) => {
    const targetUrl = imageList[index];
    setImageList(prev => prev.filter((_, i) => i !== index));

    if (targetUrl.startsWith("http")) {
      setRemovedImages(prev => [...prev, targetUrl]);
    }
  };

  // Edit / Delete Triggers
  const handleOpenMenu = (event: DateHistory) => {
    setMenuEvent(event);
  };

  const triggerEdit = () => {
    if (!menuEvent) return;
    const event = menuEvent;
    setMenuEvent(null);


    setEditingId(event.id);
    // Convert ISO string to YYYY-MM-DDTHH:MM local representation
    const localDate = new Date(event.time);
    const tzOffset = localDate.getTimezoneOffset() * 60000; // offset in milliseconds
    const localISOTime = new Date(localDate.getTime() - tzOffset).toISOString().slice(0, 16);
    setDatetime(localISOTime);

    setSelectedType(event.type);
    setNote(event.note || "");
    setImageList(event.imageList || []);
    setRemovedImages([]);
    setReason(event.reason || "");
    setShowForm(true);
  };

  const triggerDelete = () => {
    if (!menuEvent) return;
    const event = menuEvent;
    setMenuEvent(null);


    const id = event.id;
    const imagesToDelete = event.imageList || [];

    CustomAlert.alert(
      "Xác nhận xóa",
      "Bạn có chắc chắn muốn xóa hoàn toàn khoảnh khắc này?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await AsyncStorageService.deleteHistoryItem(id);

              // Delete associated Google Drive images
              for (const url of imagesToDelete) {
                const fileId = GoogleDriveService.getFileIdFromUrl(url);
                if (fileId) {
                  try {
                    await GoogleDriveService.deleteFile(fileId);
                  } catch (err) {
                    console.warn("Failed to delete image from Google Drive:", err);
                  }
                }
              }

              await loadData(true);
            } catch (error: any) {
              CustomAlert.alert("Lỗi", error.message || "Không thể xóa sự kiện.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setDatetime("");
    setNote("");
    setImageList([]);
    setReason("");
    setRemovedImages([]);
    if (types.length > 0) {
      setSelectedType(types[0].name);
    }
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType) {
      CustomAlert.alert("Lỗi", "Vui lòng chọn loại hẹn hò.");
      return;
    }
    if (!note.trim()) {
      CustomAlert.alert("Yêu cầu", "Vui lòng nhập Ghi chú kỉ niệm trước khi lưu.");
      return;
    }
    if (!datetime) {
      CustomAlert.alert("Lỗi", "Vui lòng chọn ngày giờ diễn ra.");
      return;
    }

    try {
      setLoading(true);

      // Filter blob URLs (selected local files) and standard http URLs (already in Drive)
      const localUris = imageList.filter(uri => !uri.startsWith("http"));
      const existingUrls = imageList.filter(uri => uri.startsWith("http"));

      const uploadedUrls: string[] = [];
      if (localUris.length > 0) {
        setUploadingImage(true);
        try {
          for (const localUri of localUris) {
            const uploadedUrl = await GoogleDriveService.uploadImage(localUri);
            uploadedUrls.push(uploadedUrl);
          }
        } catch (uploadError: any) {
          throw new Error(`Tải ảnh lên Google Drive thất bại: ${uploadError.message || uploadError}`);
        } finally {
          setUploadingImage(false);
        }
      }

      const finalImageList = [...existingUrls, ...uploadedUrls];
      const payload = {
        time: new Date(datetime).toISOString(),
        type: selectedType,
        note: note.trim(),
        imageList: finalImageList,
        reason: reason.trim(),
      };

      if (editingId) {
        await AsyncStorageService.updateHistoryItem(editingId, payload);
      } else {
        await AsyncStorageService.addHistoryItem(payload);
      }

      // Delete removed original images from Drive
      for (const url of removedImages) {
        const fileId = GoogleDriveService.getFileIdFromUrl(url);
        if (fileId) {
          try {
            await GoogleDriveService.deleteFile(fileId);
          } catch (err) {
            console.warn("Failed to delete removed original image:", err);
          }
        }
      }

      await loadData();
      handleCancelForm();
    } catch (error: any) {
      CustomAlert.alert("Lỗi khi lưu", error.message || "Lưu thông tin thất bại.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = () => {
    if (types.length === 0) {
      CustomAlert.alert(
        "Chưa có loại hình hẹn hò",
        "Bạn chưa có loại hình hẹn hò nào. Vui lòng thêm loại hình hẹn hò trong mục Cài đặt trước.",
        [
          { text: "Đóng", style: "cancel" }
        ]
      );
      return;
    }

    // Set default datetime to local YYYY-MM-DDTHH:MM representation of now
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const localNowStr = new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
    setDatetime(localNowStr);

    if (types.length > 0) {
      setSelectedType(types[0].name);
    }
    setShowForm(true);
  };

  return (
    <div className="container animate-fade" style={{ paddingBottom: "70px", flex: 1 }}>
      {/* Loading Overlay */}
      {loading && (
        <div 
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(248, 251, 254, 0.7)",
            zIndex: 900,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            textAlign: "center"
          }}
        >
          <div className="spinner"></div>
          {uploadingImage && (
            <p style={{ fontSize: "14px", color: "var(--primary-dark)", marginTop: "12px", maxWidth: "280px" }}>
              Upload ảnh chất lượng cao lên Google Drive đang được xử lý. Vui lòng chờ...
            </p>
          )}
        </div>
      )}

      {/* Main Title Header */}
      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "20px", color: "var(--text)" }}>
          Nhật ký khoảnh khắc 📖
        </h2>
        <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
          Lưu giữ những chuyến đi và kỉ niệm ngọt ngào
        </p>
      </div>

      {/* Diary Feed List */}
      {allHistory.length === 0 ? (
        <div 
          style={{ 
            display: "flex", 
            flexDirection: "column", 
            alignItems: "center", 
            justifyContent: "center", 
            flex: 1, 
            minHeight: "350px",
            textAlign: "center",
            color: "var(--text-muted)"
          }}
        >
          <span style={{ fontSize: "52px", marginBottom: "16px" }}>💝</span>
          <h4 style={{ fontSize: "15px", color: "var(--text)", fontWeight: 600 }}>Chưa có kỉ niệm nào được lưu</h4>
          <p style={{ fontSize: "13px", maxWidth: "260px", marginTop: "6px", lineHeight: 1.4 }}>
            Click biểu tượng nút "+" phía bên dưới để lưu giữ dấu ấn hẹn hò đầu tiên nhé!
          </p>
        </div>
      ) : (
        <>
          <div className="responsive-grid">
            {history.map((item) => {
              return (
                <div 
                  key={item.id}
                  style={{
                    backgroundColor: "var(--surface)",
                    borderRadius: "var(--radius-lg)",
                    padding: "16px",
                    border: "1px solid var(--border)",
                    boxShadow: "0 4px 6px -1px rgba(85, 150, 224, 0.02)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px"
                  }}
                >
                  {/* Card Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div 
                      style={{
                        backgroundColor: "var(--primary-light)",
                        color: "var(--primary-dark)",
                        padding: "4px 10px",
                        borderRadius: "var(--radius-sm)",
                        fontSize: "12px",
                        fontWeight: 600
                      }}
                    >
                      {item.type}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        {formatDateTime(item.time)}
                      </span>
                      
                      <button 
                        onClick={() => handleOpenMenu(item)}
                        style={{ padding: "4px", color: "var(--text)" }}
                      >
                        <IoEllipsisHorizontalOutline size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Card notes */}
                  <p style={{ fontSize: "14px", color: "var(--text)", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                    {item.note}
                  </p>

                  {/* Card occasion */}
                  {item.reason && (
                    <div 
                      style={{
                        display: "flex",
                        alignItems: "center",
                        backgroundColor: "var(--background)",
                        padding: "8px 12px",
                        borderRadius: "var(--radius-sm)",
                        fontSize: "13px",
                        color: "var(--text)",
                        gap: "6px"
                      }}
                    >
                      <IoChatboxEllipsesOutline size={15} color="var(--primary)" />
                      <span>
                        <strong>Dịp: </strong>{item.reason}
                      </span>
                    </div>
                  )}

                  {/* Horizontal Scrollable Images */}
                  {item.imageList && item.imageList.length > 0 && (
                    <div 
                      style={{
                        display: "flex",
                        gap: "8px",
                        overflowX: "auto",
                        paddingBottom: "4px",
                        scrollbarWidth: "none"
                      }}
                    >
                      {item.imageList.map((imgUri, index) => (
                        <LazyImage 
                          key={index}
                          src={GoogleDriveService.resolveDriveUrl(imgUri)}
                          alt="Kỷ niệm"
                          onClick={() => {
                            setViewerImages(item.imageList);
                            setViewerIndex(index);
                            setShowViewer(true);
                          }}
                          style={{
                            width: "90px",
                            height: "90px",
                            borderRadius: "var(--radius-md)",
                            objectFit: "cover",
                            cursor: "pointer",
                            flexShrink: 0,
                            border: "1px solid var(--border)",
                            transition: "opacity 0.2s",
                          }}
                          onMouseOver={(e) => e.currentTarget.style.opacity = "0.9"}
                          onMouseOut={(e) => e.currentTarget.style.opacity = "1"}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Load More Trigger */}
          {history.length < allHistory.length && (
            <button
              onClick={handleLoadMore}
              style={{
                width: "100%",
                padding: "12px",
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--primary-dark)",
                marginTop: "20px",
              }}
            >
              Xem thêm lịch sử hẹn hò
            </button>
          )}
        </>
      )}

      {/* FAB button */}
      <button
        onClick={handleOpenForm}
        className="fab-add-button"
        style={{
          position: "fixed",
          bottom: "80px",
          right: "40px",
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          backgroundColor: "var(--accent)",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 10px 15px -3px rgba(243, 104, 224, 0.4)",
          zIndex: 80,
          border: "none",
        }}
      >
        <IoAddOutline size={28} />
      </button>

      {/* Enforce desktop bounds adjustments */}
      <style>{`
        @media (min-width: 769px) {
          .fab-add-button {
            bottom: 40px !important;
            right: 40px !important;
          }
        }
        @media (max-width: 768px) {
          .fab-add-button {
            bottom: 80px !important;
            right: 20px !important;
          }
        }
      `}</style>

      {/* Overlay modal Form */}
      {showForm && (
        <div 
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.5)",
            backdropFilter: "blur(4px)",
            zIndex: 950,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center"
          }}
          onClick={handleCancelForm}
        >
          <div 
            style={{
              width: "100%",
              maxWidth: "480px",
              backgroundColor: "var(--surface)",
              borderTopLeftRadius: "var(--radius-lg)",
              borderTopRightRadius: "var(--radius-lg)",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              boxShadow: "0 -10px 25px -5px rgba(0, 0, 0, 0.1)",
              maxHeight: "85vh",
              overflowY: "auto",
              animation: "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text)", fontFamily: "var(--font-display)" }}>
                {editingId ? "Cập nhật khoảnh khắc ✏️" : "Ghi lại kỉ niệm mới ❤️"}
              </h3>
              <button onClick={handleCancelForm} style={{ padding: "4px", color: "var(--text-muted)" }}>
                <IoCloseOutline size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              
              {/* Date selection picker */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>Ngày và Giờ diễn ra *</label>
                <input 
                  type="datetime-local"
                  value={datetime}
                  onChange={(e) => setDatetime(e.target.value)}
                  style={{
                    padding: "12px 14px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border)",
                    fontSize: "14px",
                    color: "var(--text)"
                  }}
                />
              </div>

              {/* Dating Category selection */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>Loại hoạt động hẹn hò *</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  style={{
                    padding: "12px 14px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border)",
                    fontSize: "14px",
                    backgroundColor: "var(--surface)",
                    color: "var(--text)"
                  }}
                >
                  {types.map(t => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </div>

              {/* Occasion / Reason */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>Dịp / Lý do diễn ra (VD: Kỉ niệm 100 ngày...)</label>
                <input 
                  type="text"
                  placeholder="Không bắt buộc"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  style={{
                    padding: "12px 14px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border)",
                    fontSize: "14px"
                  }}
                />
              </div>

              {/* Notes */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>Ghi chú khoảnh khắc ngọt ngào *</label>
                <textarea
                  placeholder="Ghi nhận những điều đáng nhớ nhất..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={4}
                  style={{
                    padding: "12px 14px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border)",
                    fontSize: "14px",
                    resize: "none",
                    lineHeight: 1.4
                  }}
                />
              </div>

              {/* Images uploads */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>Hình ảnh kỉ niệm</label>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange}
                  multiple 
                  accept="image/*"
                  style={{ display: "none" }}
                />

                <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px", scrollbarWidth: "none" }}>
                  {/* Select Trigger Box */}
                  <div 
                    onClick={handleTriggerFileInput}
                    style={{
                      width: "80px",
                      height: "80px",
                      borderRadius: "var(--radius-md)",
                      border: "2px dashed var(--border)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      flexShrink: 0
                    }}
                  >
                    <IoAddOutline size={24} />
                    <span style={{ fontSize: "10px", marginTop: "2px" }}>Thêm ảnh</span>
                  </div>

                  {/* Previews */}
                  {imageList.map((url, idx) => (
                    <div 
                      key={idx} 
                      style={{ position: "relative", width: "80px", height: "80px", flexShrink: 0 }}
                    >
                      <img 
                        src={url} 
                        alt="Preview" 
                        style={{ width: "100%", height: "100%", borderRadius: "var(--radius-md)", objectFit: "cover" }}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        style={{
                          position: "absolute",
                          top: "-6px",
                          right: "-6px",
                          width: "20px",
                          height: "20px",
                          borderRadius: "50%",
                          backgroundColor: "rgba(15, 23, 42, 0.6)",
                          color: "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: 0
                        }}
                      >
                        <IoCloseOutline size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={handleCancelForm}
                  style={{
                    flex: 1,
                    padding: "14px",
                    backgroundColor: "var(--primary-light)",
                    color: "var(--primary-dark)",
                    borderRadius: "var(--radius-md)",
                    fontSize: "14px",
                    fontWeight: 600
                  }}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 2,
                    padding: "14px",
                    backgroundColor: "var(--primary)",
                    color: "#ffffff",
                    borderRadius: "var(--radius-md)",
                    fontSize: "14px",
                    fontWeight: 600,
                    boxShadow: "0 4px 6px -1px rgba(85, 150, 224, 0.2)"
                  }}
                >
                  Lưu khoảnh khắc
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3-dots Menu Popover Sheet */}
      {menuEvent && (
        <div 
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.3)",
            zIndex: 960,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center"
          }}
          onClick={() => setMenuEvent(null)}
        >
          <div 
            style={{
              width: "100%",
              maxWidth: "480px",
              backgroundColor: "var(--surface)",
              borderTopLeftRadius: "var(--radius-lg)",
              borderTopRightRadius: "var(--radius-lg)",
              padding: "20px 24px 32px 24px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              boxShadow: "0 -10px 25px -5px rgba(0, 0, 0, 0.1)",
              animation: "slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ width: "40px", height: "4px", backgroundColor: "var(--border)", borderRadius: "2px", alignSelf: "center", marginBottom: "16px" }}></div>
            
            <h4 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "12px", fontFamily: "var(--font-display)" }}>
              Tùy chọn khoảnh khắc
            </h4>

            <button 
              onClick={triggerEdit}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                width: "100%",
                padding: "16px 12px",
                fontSize: "15px",
                color: "var(--text)",
                borderBottom: "1px solid var(--border)",
                textAlign: "left"
              }}
            >
              <IoCreateOutline size={20} color="var(--primary)" />
              <span>Chỉnh sửa khoảnh khắc</span>
            </button>

            <button 
              onClick={triggerDelete}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                width: "100%",
                padding: "16px 12px",
                fontSize: "15px",
                color: "var(--danger)",
                textAlign: "left"
              }}
            >
              <IoTrashOutline size={20} />
              <span>Xóa khoảnh khắc</span>
            </button>
          </div>
        </div>
      )}

      {/* Lightbox Image Zoom Viewer Modal */}
      {showViewer && (
        <div 
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.95)",
            zIndex: 990,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "20px 0"
          }}
          onClick={() => setShowViewer(false)}
        >
          {/* Viewer Header */}
          <div 
            style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center", 
              padding: "0 20px", 
              color: "#ffffff",
              zIndex: 1000 
            }}
            onClick={e => e.stopPropagation()}
          >
            <span style={{ fontSize: "14px", fontWeight: 500 }}>
              Ảnh {viewerIndex + 1} / {viewerImages.length}
            </span>
            <button 
              onClick={() => setShowViewer(false)}
              style={{
                color: "#ffffff",
                padding: "6px",
                backgroundColor: "rgba(255,255,255,0.15)",
                borderRadius: "50%",
                display: "flex"
              }}
            >
              <IoCloseOutline size={22} />
            </button>
          </div>

          {/* Active Image Container */}
          <div 
            style={{
              position: "relative",
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden"
            }}
            onClick={() => setShowViewer(false)}
          >
            {viewerImages.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setViewerIndex(prev => (prev === 0 ? viewerImages.length - 1 : prev - 1));
                }}
                style={{
                  position: "absolute",
                  left: "16px",
                  color: "#ffffff",
                  backgroundColor: "rgba(15, 23, 42, 0.6)",
                  borderRadius: "50%",
                  width: "40px",
                  height: "40px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 1000
                }}
              >
                <IoChevronBackOutline size={22} />
              </button>
            )}

            <LazyImage 
              src={GoogleDriveService.resolveDriveUrl(viewerImages[viewerIndex])} 
              alt="Zoomed" 
              onClick={e => e.stopPropagation()}
              style={{
                maxWidth: "100%",
                maxHeight: "80vh",
                objectFit: "contain",
                userSelect: "none",
                transition: "transform 0.2s"
              }}
            />

            {viewerImages.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setViewerIndex(prev => (prev === viewerImages.length - 1 ? 0 : prev + 1));
                }}
                style={{
                  position: "absolute",
                  right: "16px",
                  color: "#ffffff",
                  backgroundColor: "rgba(15, 23, 42, 0.6)",
                  borderRadius: "50%",
                  width: "40px",
                  height: "40px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 1000
                }}
              >
                <IoChevronForwardOutline size={22} />
              </button>
            )}
          </div>

          <div style={{ height: "40px" }}></div>
        </div>
      )}
    </div>
  );
};
