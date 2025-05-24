export interface Country {
  name: {
    common: string;         // e.g., "Germany"
    official: string;       // e.g., "Federal Republic of Germany"
    nativeName?: {
      [lang: string]: {
        official: string;
        common: string;
      };
    };
  };
  cca2: string;              // ISO 3166-1 alpha-2 (e.g., "DE")
  cca3: string;              // ISO 3166-1 alpha-3 (e.g., "DEU")
  region: string;            // e.g., "Europe"
  subregion?: string;        // e.g., "Western Europe"
  flags: {
    png: string;             // PNG flag image URL
    svg: string;             // SVG flag image URL
    alt?: string;            // Alt text description
  };
  population?: number;
  capital?: string[];
  timezones?: string[];
  latlng?: [number, number]; // [latitude, longitude]
}
