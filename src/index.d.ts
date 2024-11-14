// Declare the module for js-globe
declare module "js-globe" {
  // Declare the type for the Globe class/function
  export class Globe {
    constructor(container: HTMLElement, options?: GlobeOptions);

    // Add methods and properties for the Globe class as necessary
    addLocation(lat: number, lon: number, data?: object): void;
    removeLocation(locationId: string): void;
    render(): void;
    setOptions(options: GlobeOptions): void;
    // Example of a public property
    readonly options: GlobeOptions;
  }

  // Option interface for Globe options
  export interface GlobeOptions {
    zoom: number;
    latitude: number;
    longitude: number;
    backgroundColor?: string;
  }

}
