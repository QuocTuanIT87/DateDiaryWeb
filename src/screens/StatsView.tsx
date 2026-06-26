import React, { useState, useEffect } from "react";
import {
  AsyncStorageService,
  type DateHistory,
  type DateType,
} from "../services/AsyncStorageService";
import { formatDateTime } from "../utils/dateUtils";
import { IoFilterOutline } from "react-icons/io5";

type RangeFilter = "today" | "month" | "year" | "custom" | "all";

interface StatsViewProps {
  onBack?: () => void;
}

export const StatsView: React.FC<StatsViewProps> = ({ onBack }) => {
  const [history, setHistory] = useState<DateHistory[]>([]);
  const [types, setTypes] = useState<DateType[]>([]);

  // Filters state
  const [rangeFilter, setRangeFilter] = useState<RangeFilter>("all");
  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth(),
  ); // 0-11
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear(),
  );
  const [customStart, setCustomStart] = useState<string>(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  );
  const [customEnd, setCustomEnd] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [typeFilter, setTypeFilter] = useState<string>("Tất cả");

  const loadData = async () => {
    try {
      const list = await AsyncStorageService.getHistory();
      const loadedTypes = await AsyncStorageService.getTypes();
      setHistory(list);
      setTypes(loadedTypes);
    } catch (error) {
      console.error("Load stats failed:", error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute filtered events
  const getFilteredEvents = (): DateHistory[] => {
    return history.filter((item) => {
      const itemDate = new Date(item.time);
      const now = new Date();

      // 1. Time range check
      let matchesRange = false;
      switch (rangeFilter) {
        case "today": {
          matchesRange =
            itemDate.getDate() === now.getDate() &&
            itemDate.getMonth() === now.getMonth() &&
            itemDate.getFullYear() === now.getFullYear();
          break;
        }
        case "month": {
          matchesRange =
            itemDate.getMonth() === selectedMonth &&
            itemDate.getFullYear() === selectedYear;
          break;
        }
        case "year": {
          matchesRange = itemDate.getFullYear() === selectedYear;
          break;
        }
        case "custom": {
          const startBoundary = new Date(customStart);
          startBoundary.setHours(0, 0, 0, 0);

          const endBoundary = new Date(customEnd);
          endBoundary.setHours(23, 59, 59, 999);

          matchesRange = itemDate >= startBoundary && itemDate <= endBoundary;
          break;
        }
        case "all":
        default:
          matchesRange = true;
          break;
      }

      if (!matchesRange) return false;

      // 2. Category / Type check
      if (typeFilter === "Tất cả") return true;
      return item.type === typeFilter;
    });
  };

  const filteredEvents = getFilteredEvents();

  // Compute breakdown percentages
  const getCategoryBreakdown = () => {
    const counts: Record<string, number> = {};

    // Seed counts with 0 for all active types
    types.forEach((t) => {
      counts[t.name] = 0;
    });

    let total = 0;
    filteredEvents.forEach((item) => {
      counts[item.type] = (counts[item.type] || 0) + 1;
      total++;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      }))
      .filter(
        (item) => item.count > 0 || types.some((t) => t.name === item.name),
      ) // keep active types
      .sort((a, b) => b.count - a.count); // Most frequent first
  };

  const categoryBreakdown = getCategoryBreakdown();

  // Month names for select input helper
  const months = [
    "Tháng 1",
    "Tháng 2",
    "Tháng 3",
    "Tháng 4",
    "Tháng 5",
    "Tháng 6",
    "Tháng 7",
    "Tháng 8",
    "Tháng 9",
    "Tháng 10",
    "Tháng 11",
    "Tháng 12",
  ];

  // Generate list of years (e.g. from 2024 up to current year + 1)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 3 + i);

  return (
    <div
      className="container animate-fade"
      style={{ paddingBottom: "32px", flex: 1 }}
    >
      {/* Title */}
      <div
        style={{
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: "20px",
              color: "var(--text)",
            }}
          >
            Thống kê Hẹn hò 📊
          </h2>
          <p
            style={{
              fontSize: "12px",
              color: "var(--text-muted)",
              marginTop: "2px",
            }}
          >
            Nhìn lại tần suất hoạt động và kỷ niệm của hai bạn
          </p>
        </div>
        {onBack && (
          <button
            onClick={onBack}
            style={{
              padding: "8px 16px",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--primary-light)",
              color: "var(--primary-dark)",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            Quay lại Cài đặt
          </button>
        )}
      </div>

      {/* Two Columns Layout Grid */}
      <div className="two-col-grid" style={{ marginBottom: "24px" }}>
        {/* Left Column: Filters and Overall Totals */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Filter Section Card */}
          <div
            style={{
              backgroundColor: "var(--surface)",
              borderRadius: "var(--radius-lg)",
              padding: "16px",
              border: "1px solid var(--border)",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              boxShadow: "0 4px 6px -1px rgba(85, 150, 224, 0.02)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "13px",
                fontWeight: 700,
                color: "var(--primary-dark)",
              }}
            >
              <IoFilterOutline size={16} />
              <span>Bộ lọc thống kê</span>
            </div>

            {/* Range Tabs */}
            <div
              style={{
                display: "flex",
                overflowX: "auto",
                gap: "6px",
                paddingBottom: "4px",
                scrollbarWidth: "none",
              }}
            >
              {(
                ["all", "today", "month", "year", "custom"] as RangeFilter[]
              ).map((filter) => {
                const isActive = rangeFilter === filter;
                let label = "";
                switch (filter) {
                  case "all":
                    label = "Tất cả";
                    break;
                  case "today":
                    label = "Hôm nay";
                    break;
                  case "month":
                    label = "Tháng";
                    break;
                  case "year":
                    label = "Năm";
                    break;
                  case "custom":
                    label = "Tùy chọn";
                    break;
                }

                return (
                  <button
                    key={filter}
                    onClick={() => setRangeFilter(filter)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "12px",
                      fontWeight: 600,
                      backgroundColor: isActive
                        ? "var(--primary)"
                        : "var(--primary-light)",
                      color: isActive ? "#ffffff" : "var(--primary-dark)",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Dynamic Filters Configuration inputs */}
            {rangeFilter === "month" && (
              <div style={{ display: "flex", gap: "10px" }}>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  style={{
                    flex: 1,
                    padding: "8px 10px",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                    fontSize: "13px",
                    backgroundColor: "var(--surface)",
                    color: "var(--text)",
                  }}
                >
                  {months.map((m, idx) => (
                    <option key={idx} value={idx}>
                      {m}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  style={{
                    flex: 1,
                    padding: "8px 10px",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                    fontSize: "13px",
                    backgroundColor: "var(--surface)",
                    color: "var(--text)",
                  }}
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {rangeFilter === "year" && (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  fontSize: "13px",
                  backgroundColor: "var(--surface)",
                  color: "var(--text)",
                }}
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            )}

            {rangeFilter === "custom" && (
              <div
                style={{ display: "flex", gap: "10px", alignItems: "center" }}
              >
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "8px 10px",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                    fontSize: "13px",
                    color: "var(--text)",
                  }}
                />
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  đến
                </span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "8px 10px",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                    fontSize: "13px",
                    color: "var(--text)",
                  }}
                />
              </div>
            )}

            {/* Activity Category Filter Dropdown */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "6px" }}
            >
              <label
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "var(--text-muted)",
                }}
              >
                Lọc theo loại hình
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                style={{
                  padding: "8px 10px",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  fontSize: "13px",
                  backgroundColor: "var(--surface)",
                  color: "var(--text)",
                }}
              >
                <option value="Tất cả">Tất cả hoạt động</option>
                {types.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Right Column: Breakdown List Section */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{ height: "100%", display: "flex", flexDirection: "column" }}
          >
            <h3
              style={{
                fontSize: "15px",
                fontWeight: 700,
                color: "var(--text)",
                marginBottom: "14px",
                fontFamily: "var(--font-display)",
              }}
            >
              Phân tích hoạt động 📈
            </h3>

            {filteredEvents.length === 0 ? (
              <div
                style={{
                  backgroundColor: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-lg)",
                  padding: "32px",
                  textAlign: "center",
                  color: "var(--text-muted)",
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                Chưa có thông tin phù hợp để phân tích.
              </div>
            ) : (
              <div
                style={{
                  backgroundColor: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-lg)",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "18px",
                  boxShadow: "0 4px 6px -1px rgba(85, 150, 224, 0.02)",
                  flex: 1,
                }}
              >
                {categoryBreakdown.map((item, idx) => {
                  // Only display active categories or categories with data
                  if (item.count === 0 && idx >= 5) return null;
                  return (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "13px",
                        }}
                      >
                        <span style={{ fontWeight: 600, color: "var(--text)" }}>
                          {item.name}
                        </span>
                        <span
                          style={{
                            color: "var(--text-muted)",
                            fontWeight: 500,
                          }}
                        >
                          <strong>{item.count}</strong> lần (
                          {item.percentage.toFixed(0)}%)
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div
                        style={{
                          height: "8px",
                          backgroundColor: "var(--primary-light)",
                          borderRadius: "var(--radius-full)",
                          overflow: "hidden",
                          position: "relative",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${item.percentage}%`,
                            backgroundColor:
                              idx % 2 === 0
                                ? "var(--primary)"
                                : "var(--accent)",
                            borderRadius: "var(--radius-full)",
                            transition:
                              "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Log Summary of Filtered Items */}
      {filteredEvents.length > 0 && (
        <div>
          <h3
            style={{
              fontSize: "15px",
              fontWeight: 700,
              color: "var(--text)",
              marginBottom: "12px",
              fontFamily: "var(--font-display)",
            }}
          >
            Danh sách kỷ niệm ({filteredEvents.length})
          </h3>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {filteredEvents.slice(0, 10).map((event) => (
              <div
                key={event.id}
                style={{
                  backgroundColor: "var(--surface)",
                  borderRadius: "var(--radius-md)",
                  padding: "12px 14px",
                  border: "1px solid var(--border)",
                  fontSize: "13px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "4px",
                    fontSize: "11px",
                    color: "var(--text-muted)",
                  }}
                >
                  <span
                    style={{ fontWeight: 600, color: "var(--primary-dark)" }}
                  >
                    {event.type}
                  </span>
                  <span>{formatDateTime(event.time)}</span>
                </div>
                <p
                  style={{
                    color: "var(--text)",
                    lineHeight: 1.4,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {event.note}
                </p>
              </div>
            ))}

            {filteredEvents.length > 10 && (
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--text-muted)",
                  textAlign: "center",
                  marginTop: "4px",
                }}
              >
                ... và {filteredEvents.length - 10} kỷ niệm khác (Xem đầy đủ ở
                Tab Nhật ký)
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
