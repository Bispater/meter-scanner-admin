export interface Apartment {
  id: string;
  number: string;          // e.g. "101", "PH-A"
  meterId: string;         // physical meter ID (can change)
  qrCode?: string;         // stable QR identifier: number + tower short name (e.g. "1409A") — set by API
  floor: number;
}

export interface Tower {
  id: string;
  name: string;            // e.g. "Torre A"
  apartments: Apartment[];
}

export interface Building {
  id: string;
  name: string;            // e.g. "Edificio Los Robles"
  address: string;
  towers: Tower[];
}
