import { format } from "date-fns";
import { TripPoint } from "@/types/traccar";

interface TripHistoryTableProps {
    data: TripPoint[];
    onClose: () => void;
}

export default function TripHistoryTable({ data, onClose }: TripHistoryTableProps) {
    if (!data || data.length === 0) return null;

    // Sort by time descending (newest first)
    const sortedData = [...data].reverse();

    return (
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-20 flex flex-col max-h-[40%]">
            <div className="flex justify-between items-center p-2 border-b bg-gray-50">
                <h3 className="text-sm font-bold text-gray-700 px-2">Trip History ({data.length} points)</h3>
                <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-200"
                >
                    ✕
                </button>
            </div>

            <div className="overflow-auto flex-1">
                <table className="w-full text-xs text-left">
                    <thead className="bg-gray-50 sticky top-0 z-10 text-gray-500 font-medium">
                        <tr>
                            <th className="px-4 py-2">Time</th>
                            <th className="px-4 py-2">Speed (km/h)</th>
                            <th className="px-4 py-2">Course</th>
                            <th className="px-4 py-2">Attributes</th>
                            <th className="px-4 py-2">Protocol</th>
                            <th className="px-4 py-2">Address</th>
                            <th className="px-4 py-2">Latitude</th>
                            <th className="px-4 py-2">Longitude</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {sortedData.map((point, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                                <td className="px-4 py-2 text-gray-900 border-b border-gray-100">
                                    {point.fixTime ? format(new Date(point.fixTime), "PP pp") : "-"}
                                </td>
                                <td className="px-4 py-2 border-b border-gray-100 font-mono">
                                    {point.speed ? (point.speed * 1.852).toFixed(1) : "0.0"}
                                </td>
                                <td className="px-4 py-2 border-b border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <span style={{ transform: `rotate(${point.course || 0}deg)` }} className="inline-block text-blue-500">
                                            ⬆
                                        </span>
                                        {point.course}°
                                    </div>
                                </td>
                                <td className="px-4 py-2 border-b border-gray-100 max-w-xs" title={JSON.stringify(point.attributes)}>
                                    {point.attributes ? (
                                        <div className="flex flex-col gap-1 text-[10px]">
                                            {/* Motion */}
                                            {point.attributes.motion !== undefined && (
                                                <span className={`inline-block px-1 rounded w-fit ${point.attributes.motion ? 'bg-purple-50 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                                                    {point.attributes.motion ? 'Motion: Yes' : 'Motion: No'}
                                                </span>
                                            )}
                                            {/* Odometer */}
                                            {point.attributes.odometer !== undefined && (
                                                <span className="text-gray-600">
                                                    Odo: {(point.attributes.odometer / 1000).toFixed(2)} km
                                                </span>
                                            )}
                                            {/* Total Distance */}
                                            {point.attributes.totalDistance !== undefined && (
                                                <span className="text-gray-600">
                                                    Dist: {(point.attributes.totalDistance / 1000).toFixed(2)} km
                                                </span>
                                            )}
                                            {/* Ignition */}
                                            {point.attributes.ignition !== undefined && (
                                                <span className={`inline-block px-1 rounded w-fit ${point.attributes.ignition ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                    {point.attributes.ignition ? 'Ignition: ON' : 'Ignition: OFF'}
                                                </span>
                                            )}
                                        </div>
                                    ) : "-"}
                                </td>
                                <td className="px-4 py-2 border-b border-gray-100 text-gray-500">
                                    <div className="flex flex-col text-[10px]">
                                        <span>{point.protocol || "-"}</span>
                                        {point.network?.radioType && (
                                            <span className="text-gray-400">Radio: {point.network.radioType}</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-2 border-b border-gray-100 text-gray-500 truncate max-w-[150px]" title={point.address || ""}>{point.address || "-"}</td>
                                <td className="px-4 py-2 border-b border-gray-100 font-mono text-gray-500">{point.latitude.toFixed(6)}</td>
                                <td className="px-4 py-2 border-b border-gray-100 font-mono text-gray-500">{point.longitude.toFixed(6)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
