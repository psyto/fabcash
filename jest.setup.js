// Mock expo-secure-store
// Note: Variables must be prefixed with 'mock' to be accessible inside jest.mock
const mockSecureStore = new Map();

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn((key, value) => {
    mockSecureStore.set(key, value);
    return Promise.resolve();
  }),
  getItemAsync: jest.fn((key) => {
    return Promise.resolve(mockSecureStore.get(key) || null);
  }),
  deleteItemAsync: jest.fn((key) => {
    mockSecureStore.delete(key);
    return Promise.resolve();
  }),
}));

// Mock @react-native-async-storage/async-storage
const mockAsyncStorage = new Map();

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn((key, value) => {
    mockAsyncStorage.set(key, value);
    return Promise.resolve();
  }),
  getItem: jest.fn((key) => {
    return Promise.resolve(mockAsyncStorage.get(key) || null);
  }),
  removeItem: jest.fn((key) => {
    mockAsyncStorage.delete(key);
    return Promise.resolve();
  }),
  clear: jest.fn(() => {
    mockAsyncStorage.clear();
    return Promise.resolve();
  }),
}));

// Clean up between tests
beforeEach(() => {
  jest.clearAllMocks();
  mockSecureStore.clear();
  mockAsyncStorage.clear();
});
