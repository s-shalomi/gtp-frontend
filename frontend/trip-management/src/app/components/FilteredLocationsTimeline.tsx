import React, { useState, useEffect } from "react";
import { Timeline, Select, DatePicker, Card, Button, Switch, Spin } from "antd";
import {
    EditOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
} from "@ant-design/icons";

const { RangePicker } = DatePicker;

interface Location {
    id?: number;
    trip_id: number;
    name: string;
    description?: string;
    latitude?: number;
    longitude?: number;
    start_date: Date;
    end_date: Date;
    visited?: boolean;
    created_by: number;
    updated_by: number;
}

interface FilteredLocationsTimelineProps {
    locations: Location[];
    onEditLocation: (location: Location) => void;
    onVisitToggle: (location: Location) => void;
    onLocationsFiltered: (filteredLocations: Location[]) => void;
    loadingLocations: Set<number>;
}

const FilteredLocationsTimeline: React.FC<FilteredLocationsTimelineProps> = ({
    locations,
    onEditLocation,
    onVisitToggle,
    onLocationsFiltered,
    loadingLocations,
}) => {
    const [filterType, setFilterType] = useState("all");
    const [filteredLocations, setFilteredLocations] =
        useState<Location[]>(locations);

    const filterLocations = () => {
        const now = new Date();

        const filtered = locations.filter((location) => {
            const startDate = new Date(location.start_date);
            const endDate = new Date(location.end_date);

            switch (filterType) {
                case "today":
                    const todayStart = new Date(now.setHours(0, 0, 0, 0));
                    const todayEnd = new Date(now.setHours(23, 59, 59, 999));
                    return (
                        (startDate >= todayStart && startDate <= todayEnd) ||
                        (endDate >= todayStart && endDate <= todayEnd) ||
                        (startDate <= todayStart && endDate >= todayEnd)
                    );

                case "week":
                    const weekStart = new Date(now);
                    weekStart.setDate(now.getDate() - now.getDay());
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekStart.getDate() + 6);
                    return (
                        (startDate >= weekStart && startDate <= weekEnd) ||
                        (endDate >= weekStart && endDate <= weekEnd)
                    );

                case "month":
                    const monthStart = new Date(
                        now.getFullYear(),
                        now.getMonth(),
                        1
                    );
                    const monthEnd = new Date(
                        now.getFullYear(),
                        now.getMonth() + 1,
                        0
                    );
                    return (
                        (startDate >= monthStart && startDate <= monthEnd) ||
                        (endDate >= monthStart && endDate <= monthEnd)
                    );
                default:
                    return true;
            }
        });

        setFilteredLocations(filtered);
        onLocationsFiltered(filtered);
        return filtered;
    };

    // Refilter when dependencies change
    useEffect(() => {
        filterLocations();
    }, [locations, filterType]);

    // In the renderTimelineItems function, update the edit button rendering:
    const renderTimelineItems = () => {
        return filteredLocations.map((location) => ({
            color: location.visited ? "green" : "blue",
            children: (
                <div className="flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold">
                                {location.name}
                            </span>
                            {!location.visited && ( // Only show edit button if not visited
                                <Button
                                    type="text"
                                    icon={<EditOutlined />}
                                    size="small"
                                    onClick={() => onEditLocation(location)}
                                    className="text-gray-500 hover:text-blue-500"
                                />
                            )}
                        </div>
                        {loadingLocations.has(location.id!) ? (  // Show loading spinner if toggling
                            <Spin size="small" />
                        ) : (
                            <Switch
                                checked={location.visited}
                                onChange={() => onVisitToggle(location)}
                                checkedChildren="Visited"
                                unCheckedChildren="Not Visited"
                                className={`${
                                    location.visited
                                        ? "bg-green-500"
                                        : "bg-gray-400"
                                }`}
                            />
                        )}
                    </div>
                    <span className="text-sm text-gray-600">
                        {new Date(location.start_date).toLocaleDateString()} -{" "}
                        {new Date(location.end_date).toLocaleDateString()}
                    </span>
                    {location.description && (
                        <span className="text-sm text-gray-500 mt-1">
                            {location.description}
                        </span>
                    )}
                    <span className="text-xs text-gray-400 mt-1">
                        {location.latitude?.toFixed(4)},{" "}
                        {location.longitude?.toFixed(4)}
                    </span>
                </div>
            ),
            dot: location.visited ? (
                <CheckCircleOutlined style={{ fontSize: "16px" }} />
            ) : (
                <ClockCircleOutlined style={{ fontSize: "16px" }} />
            ),
        }));
    };

    return (
        <Card className="border-white">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">
                    Itinerary
                </h2>
                <div className="flex items-center gap-4">
                    <Select
                        value={filterType}
                        onChange={setFilterType}
                        className="w-32"
                        options={[
                            { value: "all", label: "All Time" },
                            { value: "today", label: "Today" },
                            { value: "week", label: "This Week" },
                            { value: "month", label: "This Month" },
                        ]}
                    />
                </div>
            </div>

            {filteredLocations.length > 0 ? (
                <div
                    className="h-[450px] flex-1 overflow-y-auto pl-2 pr-2 custom-modal w-full"
                    style={{ paddingRight: "0.5rem" }}
                >
                    <Timeline
                        mode="left"
                        className="py-3 mx-auto"
                        items={renderTimelineItems()}
                    />
                </div>
            ) : (
                <div className="text-center text-gray-500 py-8">
                    No destinations found for the selected time period
                </div>
            )}
        </Card>
    );
};

export default FilteredLocationsTimeline;
