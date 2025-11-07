/**
 * Jest Test Setup
 *
 * Global test configuration and mocks
 */

/**
 * Mock the snap global object
 * This is provided by MetaMask at runtime but needs to be mocked for tests
 */
(global as any).snap = {
  request: jest.fn(async ({ method, params }: any): Promise<any> => {
    switch (method) {
      case 'snap_manageState':
        if (params.operation === 'get') {
          return {
            wallets: {},
            lastHealthCheck: null,
            healthStatus: null,
          };
        }
        if (params.operation === 'update') {
          return null;
        }
        return null;
      case 'snap_notify':
        return null;
      case 'snap_dialog':
        return true;
      default:
        throw new Error(`Unhandled snap method: ${method}`);
    }
  }),
};

/**
 * Mock localStorage for browser storage
 */
(global as any).localStorage = {
  store: {} as Record<string, string>,
  getItem(key: string): string | null {
    return this.store[key] || null;
  },
  setItem(key: string, value: string): void {
    this.store[key] = value;
  },
  removeItem(key: string): void {
    delete this.store[key];
  },
  clear(): void {
    this.store = {};
  },
};

/**
 * Mock IndexedDB for YubiKey storage
 */
class MockIDBDatabase {
  private stores: Map<string, Map<string, any>> = new Map();
  public objectStoreNames: { contains: (name: string) => boolean };

  constructor() {
    this.objectStoreNames = {
      contains: (name: string) => this.stores.has(name),
    };
  }

  createObjectStore(name: string): void {
    if (!this.stores.has(name)) {
      this.stores.set(name, new Map());
    }
  }

  transaction(_storeNames: string[], _mode: string): MockIDBTransaction {
    return new MockIDBTransaction(this.stores);
  }

  close(): void {
    // Mock close - no-op
  }
}

class MockIDBTransaction {
  constructor(
    private stores: Map<string, Map<string, any>>,
  ) {}

  objectStore(name: string): MockIDBObjectStore {
    let store = this.stores.get(name);
    if (!store) {
      store = new Map();
      this.stores.set(name, store);
    }
    return new MockIDBObjectStore(store);
  }
}

class MockIDBObjectStore {
  constructor(private store: Map<string, any>) {}

  get(key: string): MockIDBRequest {
    return new MockIDBRequest(this.store.get(key));
  }

  put(value: any, key: string): MockIDBRequest {
    this.store.set(key, value);
    return new MockIDBRequest(undefined);
  }

  delete(key: string): MockIDBRequest {
    this.store.delete(key);
    return new MockIDBRequest(undefined);
  }
}

class MockIDBRequest {
  public result: any;
  public onsuccess: ((event: any) => void) | null = null;
  public onerror: ((event: any) => void) | null = null;
  public error: any = null;

  constructor(result: any, shouldFail: boolean = false) {
    this.result = result;
    // Simulate async behavior with Promise
    Promise.resolve().then(() => {
      if (shouldFail && this.onerror) {
        this.error = new Error('Mock IDB Error');
        this.onerror({ target: this });
      } else if (this.onsuccess) {
        this.onsuccess({ target: this });
      }
    });
  }
}

class MockIDBOpenDBRequest extends MockIDBRequest {
  public onupgradeneeded: ((event: any) => void) | null = null;

  constructor(_dbName: string, _version: number) {
    const db = new MockIDBDatabase();
    super(db);

    // Simulate database upgrade
    setTimeout(() => {
      if (this.onupgradeneeded) {
        this.onupgradeneeded({
          target: { result: db },
        });
      }
      if (this.onsuccess) {
        this.onsuccess({ target: this });
      }
    }, 0);
  }
}

(global as any).indexedDB = {
  databases: new Map(),
  open(name: string, version: number = 1): MockIDBOpenDBRequest {
    return new MockIDBOpenDBRequest(name, version);
  },
  deleteDatabase(name: string): MockIDBRequest {
    this.databases.delete(name);
    return new MockIDBRequest(undefined);
  },
};

/**
 * Mock console methods to reduce noise in tests
 * Comment these out if you need to debug tests
 */
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

/**
 * Clean up after each test
 */
afterEach(() => {
  // Clear localStorage
  (global as any).localStorage.clear();

  // Reset all mocks
  jest.clearAllMocks();
});
