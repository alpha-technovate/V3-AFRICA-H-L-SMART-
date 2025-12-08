export function StatusBadge({ status }: { status?: string }) {
  const safeStatus = (status || "Unknown").toUpperCase();

  const color =
    safeStatus === "CRITICAL"
      ? "bg-red-100 text-red-700"
      : safeStatus === "STABLE"
      ? "bg-green-100 text-green-700"
      : safeStatus === "OBSERVATION"
      ? "bg-yellow-100 text-yellow-700"
      : "bg-gray-200 text-gray-700";

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${color}`}>
      {safeStatus}
    </span>
  );
}
