import { useState, useEffect } from "react";
import { useMap } from "react-leaflet";
import { Search, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchResult {
    place_id: number;
    lat: string;
    lon: string;
    display_name: string;
}

interface MapSearchControlProps {
    style?: { marginTop?: string };
}

export default function MapSearchControl({ style }: MapSearchControlProps) {
    const map = useMap();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    // Debounce search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (query.length > 2) {
                searchLocation(query);
            } else {
                setResults([]);
            }
        }, 1000);

        return () => clearTimeout(timeoutId);
    }, [query]);

    const searchLocation = async (q: string) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                format: "json",
                q: q,
                limit: "5"
            });
            const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setResults(data);
            }
        } catch (error) {
            console.error("Search failed", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (result: SearchResult) => {
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);
        map.setView([lat, lon], 14, { animate: true });
        setIsExpanded(false);
        setQuery("");
        setResults([]);
    };

    // Disable Map events when interacting
    const handleFocus = () => {
        map.dragging.disable();
        map.scrollWheelZoom.disable();
    };

    const handleBlur = () => {
        map.dragging.enable();
        map.scrollWheelZoom.enable();
    };

    // Position below standard controls (Layers ~44px + Zoom ~53px + margins)
    return (
        <div
            className="leaflet-top leaflet-right bg-transparent flex flex-col items-end"
            // Default 135px, but allow override
            style={{ pointerEvents: 'auto', zIndex: 1000, margin: style?.marginTop ? `${style.marginTop} 10px 0 0` : '135px 10px 0 0' }}
        >
            <div
                className={cn(
                    "bg-white rounded-md shadow-lg border border-gray-200 transition-all duration-300 ease-in-out overflow-hidden flex items-center justify-center",
                    isExpanded ? "w-64 md:w-80 h-9 justify-start" : "w-[34px] h-[34px] cursor-pointer hover:bg-gray-50"
                )}
                onMouseEnter={() => setIsExpanded(true)}
                onMouseLeave={() => {
                    if (!query) {
                        setIsExpanded(false);
                    }
                }}
            >
                <div className={cn("flex items-center w-full px-2 h-full", !isExpanded && "justify-center px-0")}>
                    <Search className="w-4 h-4 text-gray-500 shrink-0" />

                    {isExpanded && (
                        <>
                            <Input
                                className="border-none shadow-none focus-visible:ring-0 h-9 p-2 flex-1 text-sm bg-transparent"
                                placeholder="Search location..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onFocus={handleFocus}
                                onBlur={handleBlur}
                                autoFocus
                            />
                            {loading && <Loader2 className="w-4 h-4 text-blue-500 animate-spin ml-2 shrink-0" />}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsExpanded(false);
                                    setQuery("");
                                    setResults([]);
                                }}
                                className="text-gray-400 hover:text-gray-600 ml-2 shrink-0 p-1"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {isExpanded && results.length > 0 && (
                <div className="w-64 md:w-80 bg-white mt-1 rounded-md shadow-lg border border-gray-100 divide-y max-h-60 overflow-y-auto">
                    {results.map((res) => (
                        <button
                            key={res.place_id}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 focus:bg-gray-50 transition-colors"
                            onClick={() => handleSelect(res)}
                        >
                            {res.display_name}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
