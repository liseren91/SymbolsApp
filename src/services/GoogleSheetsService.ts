import { GoogleSpreadsheet, GoogleSpreadsheetWorksheet } from 'google-spreadsheet';

// Spreadsheet ID from the URL
const SPREADSHEET_ID = '1nfNGa1BqReWQCGAbU3FVLBjxZi63tP4NKO6kskovCYQ';

interface SymbolData {
  symbol: string;  // Column A
  description: string;  // Column B
}

class GoogleSheetsService {
  private symbolsMap: Map<string, string> = new Map();
  private lastFetchTime: number = 0;
  private fetchPromise: Promise<void> | null = null;
  private readonly CACHE_DURATION = 1000 * 60 * 60; // 1 hour in milliseconds
  private isInitialized: boolean = false;

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
        
        // Determine sheet dimensions
        const rowCount = sheet.rowCount;
        console.log(`[GoogleSheetsService] Processing ${rowCount} rows`);
        
        // Start from row 1 (skip header if present)
        for (let row = 1; row < rowCount; row++) {
          try {
            const symbolCell = sheet.getCell(row, 0); // Column A
            const descriptionCell = sheet.getCell(row, 1); // Column B
            
            const symbol = symbolCell.value?.toString() || '';
            const description = descriptionCell.value?.toString() || '';
            
            if (symbol && description) {
              newSymbolsMap.set(symbol, description);
              if (row < 5 || row === rowCount - 1) { // Log just a few samples
                console.log(`[GoogleSheetsService] Row ${row}: Symbol "${symbol}" -> "${description.substring(0, 30)}${description.length > 30 ? '...' : ''}"`);
              }
            }
          } catch (cellError) {
            console.error(`[GoogleSheetsService] Error processing row ${row}:`, cellError);
            // Continue with other rows
          }
        }
        
        this.symbolsMap = newSymbolsMap;
        this.lastFetchTime = Date.now();
        
        console.log(`[GoogleSheetsService] Successfully loaded ${this.symbolsMap.size} symbols`);
      } catch (error) {
        console.error('[GoogleSheetsService] Error fetching data:', error);
        throw error;
      } finally {
        this.fetchPromise = null;
      }
    })();
    
    return this.fetchPromise;
  }
}

// Export as singleton
export default new GoogleSheetsService(); 