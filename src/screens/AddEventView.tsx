import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  AsyncStorageService,
  type DateHistory,
  type DateType,
} from "../services/AsyncStorageService";
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
  IoCreateOutline,
  IoRefreshOutline,
} from "react-icons/io5";
import { MdZoomIn, MdZoomOut } from "react-icons/md";

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
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [rotateDegree, setRotateDegree] = useState<number>(0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

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

  // Image Drag / Pan Handlers
  const handleDragStart = (clientX: number, clientY: number) => {
    if (zoomScale <= 1) return;
    setIsDragging(true);
    setDragStart({ x: clientX - panOffset.x, y: clientY - panOffset.y });
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    setPanOffset({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y,
    });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleCloseViewer = () => {
    setShowViewer(false);
    setZoomScale(1);
    setRotateDegree(0);
    setPanOffset({ x: 0, y: 0 });
    setIsDragging(false);
  };

  // Image Selection
  const handleTriggerFileInput = () => {
    if (!googleConnected) {
      CustomAlert.alert(
        "Chưa kết nối Google Drive",
        "Hình ảnh cần được lưu trữ trên Google Drive của bạn. Vui lòng vào mục Cài đặt để kết nối tài khoản Google trước.",
      );
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const newUrls = files.map((file) => URL.createObjectURL(file));
      setImageList((prev) => [...prev, ...newUrls]);
    }
  };

  const handleRemoveImage = (index: number) => {
    const targetUrl = imageList[index];
    setImageList((prev) => prev.filter((_, i) => i !== index));

    if (targetUrl.startsWith("http")) {
      setRemovedImages((prev) => [...prev, targetUrl]);
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
    const localISOTime = new Date(localDate.getTime() - tzOffset)
      .toISOString()
      .slice(0, 16);
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
                    console.warn(
                      "Failed to delete image from Google Drive:",
                      err,
                    );
                  }
                }
              }

              await loadData(true);
            } catch (error: any) {
              CustomAlert.alert(
                "Lỗi",
                error.message || "Không thể xóa sự kiện.",
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ],
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
      CustomAlert.alert(
        "Yêu cầu",
        "Vui lòng nhập Ghi chú kỉ niệm trước khi lưu.",
      );
      return;
    }
    if (!datetime) {
      CustomAlert.alert("Lỗi", "Vui lòng chọn ngày giờ diễn ra.");
      return;
    }

    try {
      setLoading(true);

      // Filter blob URLs (selected local files) and standard http URLs (already in Drive)
      const localUris = imageList.filter((uri) => !uri.startsWith("http"));
      const existingUrls = imageList.filter((uri) => uri.startsWith("http"));

      const uploadedUrls: string[] = [];
      if (localUris.length > 0) {
        setUploadingImage(true);
        try {
          for (const localUri of localUris) {
            const uploadedUrl = await GoogleDriveService.uploadImage(localUri);
            uploadedUrls.push(uploadedUrl);
          }
        } catch (uploadError: any) {
          throw new Error(
            `Tải ảnh lên Google Drive thất bại: ${uploadError.message || uploadError}`,
          );
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
      CustomAlert.alert(
        "Lỗi khi lưu",
        error.message || "Lưu thông tin thất bại.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = () => {
    if (types.length === 0) {
      CustomAlert.alert(
        "Chưa có loại hình hẹn hò",
        "Bạn chưa có loại hình hẹn hò nào. Vui lòng thêm loại hình hẹn hò trong mục Cài đặt trước.",
        [{ text: "Đóng", style: "cancel" }],
      );
      return;
    }

    // Set default datetime to local YYYY-MM-DDTHH:MM representation of now
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const localNowStr = new Date(now.getTime() - tzOffset)
      .toISOString()
      .slice(0, 16);
    setDatetime(localNowStr);

    if (types.length > 0) {
      setSelectedType(types[0].name);
    }
    setShowForm(true);
  };

  return (
    <div
      className="container animate-fade"
      style={{ paddingBottom: "70px", flex: 1 }}
    >
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
            textAlign: "center",
          }}
        >
          <div className="spinner"></div>
          {uploadingImage && (
            <p
              style={{
                fontSize: "14px",
                color: "var(--primary-dark)",
                marginTop: "12px",
                maxWidth: "280px",
              }}
            >
              Upload ảnh chất lượng cao lên Google Drive đang được xử lý. Vui
              lòng chờ...
            </p>
          )}
        </div>
      )}

      <div
        style={{
          width: "100%",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          flex: 1,
        }}
      >
        {/* Main Title Header */}
        <div style={{ marginBottom: "20px" }}>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: "20px",
              color: "var(--text)",
            }}
          >
            Nhật ký khoảnh khắc 📖
          </h2>
          <p
            style={{
              fontSize: "12px",
              color: "var(--text-muted)",
              marginTop: "2px",
            }}
          >
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
              color: "var(--text-muted)",
            }}
          >
            <span style={{ fontSize: "52px", marginBottom: "16px" }}>💝</span>
            <h4
              style={{
                fontSize: "15px",
                color: "var(--text)",
                fontWeight: 600,
              }}
            >
              Chưa có kỉ niệm nào được lưu
            </h4>
            <p
              style={{
                fontSize: "13px",
                maxWidth: "260px",
                marginTop: "6px",
                lineHeight: 1.4,
              }}
            >
              Click biểu tượng nút "+" phía bên dưới để lưu giữ dấu ấn hẹn hò
              đầu tiên nhé!
            </p>
          </div>
        ) : (
          <>
            <div className="responsive-grid">
              {history.map((item, index) => {
                return (
                  <div
                    key={item.id}
                    className="timeline-row"
                    style={{
                      zIndex: history.length - index,
                    }}
                  >
                    {/* Left Column Track containing timeline connector wire & bullet node dot */}
                    <div className="timeline-left-track">
                      <div className="timeline-dot" />
                    </div>

                    {/* Right Content Column holding text card and images next to/below each other */}
                    <div className="timeline-right-content">
                      {/* Column 1: The square card containing text */}
                      <div className="timeline-col-1-card">
                        {/* Absolute Options Menu button */}
                        <button
                          onClick={() => handleOpenMenu(item)}
                          style={{
                            position: "absolute",
                            top: "16px",
                            right: "16px",
                            padding: "6px",
                            color: "var(--text-muted)",
                            zIndex: 10,
                          }}
                        >
                          <IoEllipsisHorizontalOutline size={18} />
                        </button>

                        {/* Cute Time Font */}
                        <div className="timeline-time-cute">
                          📅 {formatDateTime(item.time)}
                        </div>

                        {/* Dating category type badge */}
                        <div
                          style={{
                            backgroundColor: "var(--primary-light)",
                            color: "var(--primary-dark)",
                            padding: "4px 10px",
                            borderRadius: "var(--radius-sm)",
                            fontSize: "10px",
                            fontWeight: 600,
                            width: "fit-content",
                          }}
                        >
                          {item.type}
                        </div>

                        {/* Ghi chú */}
                        <p className="diary-note">{item.note}</p>

                        {/* Occasion / Reason if exists */}
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
                              gap: "6px",
                            }}
                          >
                            <IoChatboxEllipsesOutline
                              size={15}
                              color="var(--primary)"
                            />
                            <span>
                              <strong>Dịp: </strong>
                              {item.reason}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Column 2: Images (Max 5 per row) */}
                      <div className="timeline-col-2-images">
                        {item.imageList && item.imageList.length > 0 ? (
                          <div className="diary-images-grid">
                            {item.imageList.map((imgUri, indexImg) => (
                              <div
                                key={indexImg}
                                className="diary-image-wrapper"
                                onClick={() => {
                                  const flatImages = history.reduce<string[]>(
                                    (acc, hItem) => {
                                      if (
                                        hItem.imageList &&
                                        hItem.imageList.length > 0
                                      ) {
                                        acc.push(...hItem.imageList);
                                      }
                                      return acc;
                                    },
                                    [],
                                  );
                                  const globalIndex =
                                    flatImages.indexOf(imgUri);
                                  setViewerImages(flatImages);
                                  setViewerIndex(
                                    globalIndex >= 0 ? globalIndex : 0,
                                  );
                                  setZoomScale(1);
                                  setRotateDegree(0);
                                  setPanOffset({ x: 0, y: 0 });
                                  setShowViewer(true);
                                }}
                              >
                                <LazyImage
                                  src={GoogleDriveService.resolveDriveUrl(
                                    imgUri,
                                  )}
                                  alt="Kỷ niệm"
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div
                            style={{
                              height: "100%",
                              minHeight: "80px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              border: "1px dashed var(--border)",
                              borderRadius: "var(--radius-md)",
                              color: "var(--text-muted)",
                              fontSize: "12px",
                              padding: "12px",
                            }}
                          >
                            🌸 Không có ảnh kỉ niệm
                          </div>
                        )}
                      </div>
                    </div>
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
      </div>

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
      {showForm &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(15, 23, 42, 0.5)",
              backdropFilter: "blur(4px)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
            }}
            onClick={handleCancelForm}
          >
            <div
              style={{
                width: "100%",
                maxWidth: "900px",
                backgroundColor: "var(--surface)",
                borderRadius: "var(--radius-lg)",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                boxShadow:
                  "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                maxHeight: "90vh",
                overflowY: "auto",
                animation: "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "var(--text)",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  {editingId
                    ? "Cập nhật khoảnh khắc ✏️"
                    : "Ghi lại kỉ niệm mới ❤️"}
                </h3>
                <button
                  onClick={handleCancelForm}
                  style={{ padding: "4px", color: "var(--text-muted)" }}
                >
                  <IoCloseOutline size={24} />
                </button>
              </div>

              <form
                onSubmit={handleSaveEvent}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <div className="form-grid">
                  {/* Column 1 */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                    }}
                  >
                    {/* Date selection picker */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                      }}
                    >
                      <label
                        style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "var(--text)",
                        }}
                      >
                        Ngày và Giờ diễn ra *
                      </label>
                      <input
                        type="datetime-local"
                        value={datetime}
                        onChange={(e) => setDatetime(e.target.value)}
                        style={{
                          padding: "12px 14px",
                          borderRadius: "var(--radius-md)",
                          border: "1px solid var(--border)",
                          fontSize: "14px",
                          color: "var(--text)",
                        }}
                      />
                    </div>

                    {/* Dating Category selection */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                      }}
                    >
                      <label
                        style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "var(--text)",
                        }}
                      >
                        Loại hoạt động hẹn hò *
                      </label>
                      <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        style={{
                          padding: "12px 14px",
                          borderRadius: "var(--radius-md)",
                          border: "1px solid var(--border)",
                          fontSize: "14px",
                          backgroundColor: "var(--surface)",
                          color: "var(--text)",
                        }}
                      >
                        {types.map((t) => (
                          <option key={t.id} value={t.name}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Occasion / Reason */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                      }}
                    >
                      <label
                        style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "var(--text)",
                        }}
                      >
                        Dịp / Lý do diễn ra (VD: Kỉ niệm 100 ngày...)
                      </label>
                      <input
                        type="text"
                        placeholder="Không bắt buộc"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        style={{
                          padding: "12px 14px",
                          borderRadius: "var(--radius-md)",
                          border: "1px solid var(--border)",
                          fontSize: "14px",
                        }}
                      />
                    </div>
                  </div>

                  {/* Column 2 */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                    }}
                  >
                    {/* Notes */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                        flex: 1,
                      }}
                    >
                      <label
                        style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "var(--text)",
                        }}
                      >
                        Ghi chú khoảnh khắc ngọt ngào *
                      </label>
                      <textarea
                        placeholder="Ghi nhận những điều đáng nhớ nhất..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        style={{
                          padding: "12px 14px",
                          borderRadius: "var(--radius-md)",
                          border: "1px solid var(--border)",
                          fontSize: "14px",
                          resize: "none",
                          lineHeight: 1.4,
                          flex: 1,
                          minHeight: "120px",
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Images uploads (full width on a new line) */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    marginTop: "8px",
                  }}
                >
                  <label
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "var(--text)",
                    }}
                  >
                    Hình ảnh kỉ niệm
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    multiple
                    accept="image/*"
                    style={{ display: "none" }}
                  />

                  {/* Select Trigger Box */}
                  <div
                    onClick={handleTriggerFileInput}
                    style={{
                      width: "100%",
                      height: "48px",
                      borderRadius: "var(--radius-md)",
                      border: "2px dashed var(--border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      backgroundColor: "rgba(85, 150, 224, 0.05)",
                      transition: "all var(--transition-fast)",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = "var(--primary)";
                      e.currentTarget.style.backgroundColor =
                        "rgba(85, 150, 224, 0.08)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = "var(--border)";
                      e.currentTarget.style.backgroundColor =
                        "rgba(85, 150, 224, 0.05)";
                    }}
                  >
                    <IoAddOutline size={20} color="var(--primary)" />
                    <span style={{ fontSize: "13px", fontWeight: 500 }}>
                      Thêm ảnh kỷ niệm
                    </span>
                  </div>

                  {/* Previews Horizontal Row */}
                  {imageList.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        overflowX: "auto",
                        paddingBottom: "8px",
                        paddingTop: "4px",
                        scrollbarWidth: "thin",
                        marginTop: "4px",
                      }}
                    >
                      {imageList.map((url, idx) => (
                        <div
                          key={idx}
                          style={{
                            position: "relative",
                            width: "80px",
                            height: "80px",
                            flexShrink: 0,
                          }}
                        >
                          <img
                            src={url}
                            alt="Preview"
                            style={{
                              width: "100%",
                              height: "100%",
                              borderRadius: "var(--radius-md)",
                              objectFit: "cover",
                            }}
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
                              padding: 0,
                              border: "1px solid rgba(255, 255, 255, 0.3)",
                            }}
                          >
                            <IoCloseOutline size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
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
                      fontWeight: 600,
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
                      boxShadow: "0 4px 6px -1px rgba(85, 150, 224, 0.2)",
                    }}
                  >
                    Lưu khoảnh khắc
                  </button>
                </div>
              </form>
            </div>

            <style>{`
            .form-grid {
              display: grid;
              grid-template-columns: 1fr;
              gap: 16px;
              width: 100%;
            }
            @media (min-width: 769px) {
              .form-grid {
                grid-template-columns: 1fr 1fr;
                gap: 24px;
              }
            }
          `}</style>
          </div>,
          document.body,
        )}

      {/* 3-dots Menu Popover Sheet */}
      {menuEvent &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px",
            }}
            onClick={() => setMenuEvent(null)}
          >
            <div
              style={{
                width: "100%",
                maxWidth: "400px",
                backgroundColor: "var(--surface)",
                borderRadius: "var(--radius-lg)",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                animation: "slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h4
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "var(--text)",
                  marginBottom: "16px",
                  fontFamily: "var(--font-display)",
                  textAlign: "center",
                }}
              >
                Tùy chọn khoảnh khắc
              </h4>

              <button
                onClick={triggerEdit}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  width: "100%",
                  padding: "14px 12px",
                  fontSize: "15px",
                  color: "var(--text)",
                  borderBottom: "1px solid var(--border)",
                  textAlign: "left",
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
                  padding: "14px 12px",
                  fontSize: "15px",
                  color: "var(--danger)",
                  textAlign: "left",
                }}
              >
                <IoTrashOutline size={20} />
                <span>Xóa khoảnh khắc</span>
              </button>
            </div>
          </div>,
          document.body,
        )}

      {/* Lightbox Image Zoom Viewer Modal */}
      {showViewer &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.6)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              zIndex: 9999,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "20px 0",
              animation: "fadeIn 0.2s ease-out",
            }}
            onClick={handleCloseViewer}
          >
            {/* Viewer Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0 24px",
                color: "#ffffff",
                zIndex: 1000,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  fontFamily: "var(--font-display)",
                }}
              >
                Ảnh {viewerIndex + 1} / {viewerImages.length}
              </span>
              <button
                onClick={handleCloseViewer}
                style={{
                  color: "#ffffff",
                  padding: "8px",
                  backgroundColor: "rgba(255, 255, 255, 0.15)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "50%",
                  display: "flex",
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "rgba(255, 255, 255, 0.25)";
                  e.currentTarget.style.transform = "scale(1.05)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "rgba(255, 255, 255, 0.15)";
                  e.currentTarget.style.transform = "scale(1)";
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
                overflow: "hidden",
              }}
              onClick={handleCloseViewer}
            >
              {viewerImages.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewerIndex((prev) => {
                      setZoomScale(1);
                      setRotateDegree(0);
                      setPanOffset({ x: 0, y: 0 });
                      setIsDragging(false);
                      return prev === 0 ? viewerImages.length - 1 : prev - 1;
                    });
                  }}
                  style={{
                    position: "absolute",
                    left: "20px",
                    color: "#ffffff",
                    backgroundColor: "rgba(255, 255, 255, 0.15)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: "50%",
                    width: "44px",
                    height: "44px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                    zIndex: 1000,
                    transition: "all 0.2s",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "rgba(255, 255, 255, 0.25)";
                    e.currentTarget.style.borderColor =
                      "rgba(255, 255, 255, 0.4)";
                    e.currentTarget.style.transform = "scale(1.08)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "rgba(255, 255, 255, 0.15)";
                    e.currentTarget.style.borderColor =
                      "rgba(255, 255, 255, 0.2)";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  <IoChevronBackOutline size={22} />
                </button>
              )}

              <img
                src={GoogleDriveService.resolveDriveUrl(
                  viewerImages[viewerIndex],
                )}
                alt="Zoomed"
                referrerPolicy="no-referrer"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleDragStart(e.clientX, e.clientY);
                }}
                onMouseMove={(e) => {
                  e.preventDefault();
                  handleDragMove(e.clientX, e.clientY);
                }}
                onMouseUp={handleDragEnd}
                onMouseLeave={handleDragEnd}
                onTouchStart={(e) => {
                  const touch = e.touches[0];
                  handleDragStart(touch.clientX, touch.clientY);
                }}
                onTouchMove={(e) => {
                  const touch = e.touches[0];
                  handleDragMove(touch.clientX, touch.clientY);
                }}
                onTouchEnd={handleDragEnd}
                style={{
                  maxWidth: "90vw",
                  maxHeight: "70vh",
                  objectFit: "contain",
                  userSelect: "none",
                  cursor:
                    zoomScale > 1
                      ? isDragging
                        ? "grabbing"
                        : "grab"
                      : "default",
                  transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomScale}) rotate(${rotateDegree}deg)`,
                  transition: isDragging
                    ? "none"
                    : "transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)",
                  borderRadius: "var(--radius-md)",
                  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.25)",
                  border: "2px solid rgba(255, 255, 255, 0.1)",
                }}
              />

              {viewerImages.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewerIndex((prev) => {
                      setZoomScale(1);
                      setRotateDegree(0);
                      setPanOffset({ x: 0, y: 0 });
                      setIsDragging(false);
                      return prev === viewerImages.length - 1 ? 0 : prev + 1;
                    });
                  }}
                  style={{
                    position: "absolute",
                    right: "20px",
                    color: "#ffffff",
                    backgroundColor: "rgba(255, 255, 255, 0.15)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: "50%",
                    width: "44px",
                    height: "44px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                    zIndex: 1000,
                    transition: "all 0.2s",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "rgba(255, 255, 255, 0.25)";
                    e.currentTarget.style.borderColor =
                      "rgba(255, 255, 255, 0.4)";
                    e.currentTarget.style.transform = "scale(1.08)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "rgba(255, 255, 255, 0.15)";
                    e.currentTarget.style.borderColor =
                      "rgba(255, 255, 255, 0.2)";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  <IoChevronForwardOutline size={22} />
                </button>
              )}
            </div>

            {/* Action Controls Bar */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "16px",
                zIndex: 1000,
                paddingBottom: "10px",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Zoom Out Button */}
              <button
                onClick={() =>
                  setZoomScale((prev) => Math.max(0.5, prev - 0.25))
                }
                style={{
                  color: "#ffffff",
                  backgroundColor: "rgba(255, 255, 255, 0.15)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                  borderRadius: "50%",
                  width: "46px",
                  height: "46px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "rgba(255, 255, 255, 0.25)";
                  e.currentTarget.style.borderColor =
                    "rgba(255, 255, 255, 0.4)";
                  e.currentTarget.style.transform = "scale(1.08)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "rgba(255, 255, 255, 0.15)";
                  e.currentTarget.style.borderColor =
                    "rgba(255, 255, 255, 0.2)";
                  e.currentTarget.style.transform = "scale(1)";
                }}
                title="Thu nhỏ"
              >
                <MdZoomOut size={22} />
              </button>

              {/* Reset Button */}
              <button
                onClick={() => {
                  setZoomScale(1);
                  setRotateDegree(0);
                  setPanOffset({ x: 0, y: 0 });
                  setIsDragging(false);
                }}
                style={{
                  color: "#ffffff",
                  backgroundColor: "rgba(255, 255, 255, 0.15)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                  borderRadius: "20px",
                  padding: "0 16px",
                  height: "38px",
                  fontSize: "12px",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "4px",
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "rgba(255, 255, 255, 0.25)";
                  e.currentTarget.style.borderColor =
                    "rgba(255, 255, 255, 0.4)";
                  e.currentTarget.style.transform = "scale(1.04)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "rgba(255, 255, 255, 0.15)";
                  e.currentTarget.style.borderColor =
                    "rgba(255, 255, 255, 0.2)";
                  e.currentTarget.style.transform = "scale(1)";
                }}
                title="Đặt lại thiết lập"
              >
                <span>{Math.round(zoomScale * 100)}%</span>
                {rotateDegree !== 0 && <span> ({rotateDegree}°)</span>}
              </button>

              {/* Zoom In Button */}
              <button
                onClick={() => setZoomScale((prev) => Math.min(3, prev + 0.25))}
                style={{
                  color: "#ffffff",
                  backgroundColor: "rgba(255, 255, 255, 0.15)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                  borderRadius: "50%",
                  width: "46px",
                  height: "46px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "rgba(255, 255, 255, 0.25)";
                  e.currentTarget.style.borderColor =
                    "rgba(255, 255, 255, 0.4)";
                  e.currentTarget.style.transform = "scale(1.08)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "rgba(255, 255, 255, 0.15)";
                  e.currentTarget.style.borderColor =
                    "rgba(255, 255, 255, 0.2)";
                  e.currentTarget.style.transform = "scale(1)";
                }}
                title="Phóng to"
              >
                <MdZoomIn size={22} />
              </button>

              {/* Rotate Button */}
              <button
                onClick={() => setRotateDegree((prev) => (prev + 90) % 360)}
                style={{
                  color: "#ffffff",
                  backgroundColor: "rgba(255, 255, 255, 0.15)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                  borderRadius: "50%",
                  width: "46px",
                  height: "46px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "rgba(255, 255, 255, 0.25)";
                  e.currentTarget.style.borderColor =
                    "rgba(255, 255, 255, 0.4)";
                  e.currentTarget.style.transform = "scale(1.08)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "rgba(255, 255, 255, 0.15)";
                  e.currentTarget.style.borderColor =
                    "rgba(255, 255, 255, 0.2)";
                  e.currentTarget.style.transform = "scale(1)";
                }}
                title="Đổi chiều ảnh"
              >
                <IoRefreshOutline size={20} />
              </button>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};
