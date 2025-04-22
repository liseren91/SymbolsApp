import { GoogleSpreadsheet, GoogleSpreadsheetWorksheet } from 'google-spreadsheet';
import { StorageService, PointOfInterest } from './StorageService'; // Import PointOfInterest

// Spreadsheet ID from the URL
const SPREADSHEET_ID = '1nfNGa1BqReWQCGAbU3FVLBjxZi63tP4NKO6kskovCYQ';

interface SymbolData {
  symbol: string;  // Column A
  description: string;  // Column B
  latitude?: number;  // Column C
  longitude?: number;  // Column D
  name?: string;  // Column E
}

class GoogleSheetsService {
  private symbolsMap: Map<string, string> = new Map();
  private lastFetchTime: number = 0;
  private fetchPromise: Promise<void> | null = null;
  private readonly CACHE_DURATION = 1000 * 60 * 60; // 1 hour in milliseconds
  private isInitialized: boolean = false;
  private pointsFromSheets: PointOfInterest[] = []; // Хранение точек, полученных из Google Sheets

  /**
   * Initialize the service and load data
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('[GoogleSheetsService] Already initialized');
      return;
    }
    
    try {
      await this.fetchData();
      this.isInitialized = true;
      console.log('[GoogleSheetsService] Successfully initialized');
    } catch (error) {
      console.error('[GoogleSheetsService] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Get description for a symbol
   * @param symbol The symbol to look up
   * @returns The description or undefined if not found
   */
  getDescriptionForSymbol(symbol: string): string | undefined {
    console.log(`[GoogleSheetsService] Looking up description for symbol: "${symbol}"`);
    
    // Check if we need to refresh the cache
    const now = Date.now();
    if (now - this.lastFetchTime > this.CACHE_DURATION) {
      // Refresh in background, don't wait for it
      this.fetchData().catch(err => {
        console.error('[GoogleSheetsService] Failed to refresh symbol data:', err);
      });
    }
    
    const description = this.symbolsMap.get(symbol);
    if (description) {
      console.log(`[GoogleSheetsService] Found description for "${symbol}": "${description.substring(0, 50)}${description.length > 50 ? '...' : ''}"`);
    } else {
      console.log(`[GoogleSheetsService] No description found for symbol: "${symbol}"`);
    }
    
    return description;
  }

  /**
   * Fetch data from Google Sheets
   */
  async fetchData(): Promise<void> {
    // If already fetching, return the existing promise
    if (this.fetchPromise) {
      console.log('[GoogleSheetsService] Already fetching data, reusing promise');
      return this.fetchPromise;
    }

    this.fetchPromise = (async () => {
      try {
        console.log('[GoogleSheetsService] Fetching symbols data from spreadsheet');
        
        // Create with options object which includes API key
        const doc = new GoogleSpreadsheet(SPREADSHEET_ID, {
          apiKey: 'AIzaSyAqWMZHM5pcaNzNmyK9E6NFVfbBW7fJhNs' // Using the same API key from Google Maps
        });
        
        // Load document properties and sheets
        console.log('[GoogleSheetsService] Loading document info');
        await doc.loadInfo();
        
        const sheet = doc.sheetsByIndex[0]; // Get the first sheet
        if (!sheet) {
          throw new Error('No sheets found in the spreadsheet');
        }
        
        console.log(`[GoogleSheetsService] Found sheet: ${sheet.title}`);
        
        // Load all cells in the sheet
        console.log('[GoogleSheetsService] Loading cells');
        await sheet.loadCells();
        
        const newSymbolsMap = new Map<string, string>();
        const pointsOfInterest: PointOfInterest[] = [];
        
        // Determine sheet dimensions
        const rowCount = sheet.rowCount;
        console.log(`[GoogleSheetsService] Processing ${rowCount} rows`);
        
        // Start from row 1 (skip header if present)
        for (let row = 1; row < rowCount; row++) {
          try {
            const symbolCell = sheet.getCell(row, 0); // Column A: symbol
            const descriptionCell = sheet.getCell(row, 1); // Column B: description
            const latitudeCell = sheet.getCell(row, 2); // Column C: latitude
            const longitudeCell = sheet.getCell(row, 3); // Column D: longitude
            const nameCell = sheet.getCell(row, 4); // Column E: name
            
            const symbol = symbolCell.value?.toString() || '';
            const description = descriptionCell.value?.toString() || '';
            
            // Add symbol and description to map
            if (symbol && description) {
              newSymbolsMap.set(symbol, description);
              if (row < 5 || row === rowCount - 1) { // Log just a few samples
                console.log(`[GoogleSheetsService] Row ${row}: Symbol "${symbol}" -> "${description.substring(0, 30)}${description.length > 30 ? '...' : ''}"`);
              }
            }
            
            // Check for coordinates and create point of interest
            const latitude = parseFloat(latitudeCell.value?.toString() || '');
            const longitude = parseFloat(longitudeCell.value?.toString() || '');
            const name = nameCell.value?.toString() || symbol; // Use symbol as name if not provided
            
            if (symbol && !isNaN(latitude) && !isNaN(longitude)) {
              const point: PointOfInterest = {
                id: `gs-${row}`, // Generate ID based on row number
                symbol: symbol,
                latitude: latitude,
                longitude: longitude,
                name: name || symbol,
              };
              
              pointsOfInterest.push(point);
              console.log(`[GoogleSheetsService] Added POI: "${name}" at ${latitude}, ${longitude}`);
            }
          } catch (cellError) {
            console.error(`[GoogleSheetsService] Error processing row ${row}:`, cellError);
            // Continue with other rows
          }
        }
        
        this.symbolsMap = newSymbolsMap;
        this.lastFetchTime = Date.now();
        
        console.log(`[GoogleSheetsService] Successfully loaded ${this.symbolsMap.size} symbols and ${pointsOfInterest.length} points of interest`);
        
        // Save points to local storage and update internal state
        if (pointsOfInterest.length > 0) {
          this.pointsFromSheets = pointsOfInterest; // Сохраняем в классе
          try {
            await this.updatePointsOfInterest(pointsOfInterest);
          } catch (storageError) {
            console.error('[GoogleSheetsService] Error saving points to storage:', storageError);
          }
        }
      } catch (error) {
        console.error('[GoogleSheetsService] Error fetching data:', error);
        throw error;
      } finally {
        this.fetchPromise = null;
      }
    })();
    
    return this.fetchPromise;
  }

  /**
   * Update points of interest in local storage
   * @param points Points of interest to save
   */
  private async updatePointsOfInterest(points: PointOfInterest[]): Promise<void> {
    try {
      // Get existing points first
      const existingPoints = await StorageService.loadPoints();
      
      // Filter out points that originated from Google Sheets
      const localPoints = existingPoints.filter(p => !p.id.startsWith('gs-'));
      
      // Combine local points with Google Sheets points
      const mergedPoints = [...localPoints, ...points];
      
      // Save merged points back to storage
      await StorageService.savePoints(mergedPoints);
      console.log(`[GoogleSheetsService] Saved ${points.length} points from Google Sheets to storage`);
    } catch (error) {
      console.error('[GoogleSheetsService] Failed to update points of interest:', error);
      throw error;
    }
  }

  /**
   * Get all points of interest from Google Sheets
   * @returns Array of points loaded from Google Sheets
   */
  getPointsOfInterest(): PointOfInterest[] {
    // Check if we need to refresh the cache
    const now = Date.now();
    if (now - this.lastFetchTime > this.CACHE_DURATION) {
      // Refresh in background, don't wait for it
      this.fetchData().catch(err => {
        console.error('[GoogleSheetsService] Failed to refresh points data:', err);
      });
    }
    
    return this.pointsFromSheets;
  }
}

// Export as singleton
export default new GoogleSheetsService(); 