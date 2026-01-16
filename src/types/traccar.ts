export interface TraccarPosition {
    id: number;
    deviceId: number;
    protocol: string;
    serverTime: string;
    deviceTime: string;
    fixTime: string;
    outdated: boolean;
    valid: boolean;
    latitude: number;
    longitude: number;
    altitude: number;
    speed: number;
    course: number;
    address: string | null;
    attributes: Record<string, any>;
}

export interface TraccarDevice {
    id: number;
    name: string;
    uniqueId: string;
    status: string;
    lastUpdate: string;
    positionId: number;
    groupId: number;
    phone: string;
    model: string;
    contact: string;
    category: string | null;
    disabled: boolean;
    attributes: Record<string, any>;
}

export interface SocketData {
    positions?: TraccarPosition[];
    devices?: TraccarDevice[];
    events?: any[];
}

export interface TraccarNetwork {
    radioType?: string;
    mcc?: number;
    mnc?: number;
    lac?: number;
    cid?: number;
}

export interface TripPoint {
    latitude: number;
    longitude: number;
    speed?: number;
    course?: number;
    fixTime?: string;
    attributes?: Record<string, any>;
    protocol?: string;
    address?: string | null;
    network?: TraccarNetwork;
}
