import { create } from 'zustand';
import { 
  subscribeToConfig, 
  subscribeToFacilities, 
  subscribeToBookings, 
  subscribeToAdmins, 
  subscribeToTransactions,
  subscribeToInventory
} from '../lib/db';

interface AppState {
  config: any;
  facilities: any[];
  bookings: any[];
  admins: any[];
  transactions: any[];
  inventory: any[];
  
  // Loaded indicators
  isConfigLoaded: boolean;
  isFacilitiesLoaded: boolean;
  isBookingsLoaded: boolean;
  isAdminsLoaded: boolean;
  isTransactionsLoaded: boolean;
  isInventoryLoaded: boolean;

  // Setters
  setConfig: (config: any) => void;
  setFacilities: (facilities: any[]) => void;
  setBookings: (bookings: any[]) => void;
  setAdmins: (admins: any[]) => void;
  setTransactions: (transactions: any[]) => void;
  setInventory: (inventory: any[]) => void;

  // Subscription initializer
  initSubscriptions: () => () => void;
}

// Global active subscriptions manager
let unsubscribeConfig: (() => void) | null = null;
let unsubscribeFacilities: (() => void) | null = null;
let unsubscribeBookings: (() => void) | null = null;
let unsubscribeAdmins: (() => void) | null = null;
let unsubscribeTransactions: (() => void) | null = null;
let unsubscribeInventory: (() => void) | null = null;
let subscriptionCount = 0;

export const useAppStore = create<AppState>((set) => ({
  config: {
    isAvailable: true,
    currentEvent: '',
    devFund: 'Rp 0',
    opsFund: 'Rp 0',
    devFundRate: 0.2,
    monthlyBudget: 5000000,
  },
  facilities: [],
  bookings: [],
  admins: [],
  transactions: [],
  inventory: [],

  isConfigLoaded: false,
  isFacilitiesLoaded: false,
  isBookingsLoaded: false,
  isAdminsLoaded: false,
  isTransactionsLoaded: false,
  isInventoryLoaded: false,

  setConfig: (config) => set({ config, isConfigLoaded: true }),
  setFacilities: (facilities) => set({ facilities, isFacilitiesLoaded: true }),
  setBookings: (bookings) => set({ bookings, isBookingsLoaded: true }),
  setAdmins: (admins) => set({ admins, isAdminsLoaded: true }),
  setTransactions: (transactions) => set({ transactions, isTransactionsLoaded: true }),
  setInventory: (inventory) => set({ inventory, isInventoryLoaded: true }),

  initSubscriptions: () => {
    subscriptionCount++;
    
    // Only set up listeners once globally
    if (subscriptionCount === 1) {
      if (!unsubscribeConfig) {
        unsubscribeConfig = subscribeToConfig((data) => {
          set({ config: data, isConfigLoaded: true });
        });
      }
      if (!unsubscribeFacilities) {
        unsubscribeFacilities = subscribeToFacilities((data) => {
          set({ facilities: data, isFacilitiesLoaded: true });
        });
      }
      if (!unsubscribeBookings) {
        unsubscribeBookings = subscribeToBookings((data) => {
          set({ bookings: data, isBookingsLoaded: true });
        });
      }
      if (!unsubscribeAdmins) {
        unsubscribeAdmins = subscribeToAdmins((data) => {
          set({ admins: data, isAdminsLoaded: true });
        });
      }
      if (!unsubscribeTransactions) {
        unsubscribeTransactions = subscribeToTransactions((data) => {
          set({ transactions: data, isTransactionsLoaded: true });
        });
      }
      if (!unsubscribeInventory) {
        unsubscribeInventory = subscribeToInventory((data) => {
          set({ inventory: data, isInventoryLoaded: true });
        });
      }
    }

    // Return clean up function
    return () => {
      subscriptionCount--;
      if (subscriptionCount <= 0) {
        subscriptionCount = 0;
        if (unsubscribeConfig) { unsubscribeConfig(); unsubscribeConfig = null; }
        if (unsubscribeFacilities) { unsubscribeFacilities(); unsubscribeFacilities = null; }
        if (unsubscribeBookings) { unsubscribeBookings(); unsubscribeBookings = null; }
        if (unsubscribeAdmins) { unsubscribeAdmins(); unsubscribeAdmins = null; }
        if (unsubscribeTransactions) { unsubscribeTransactions(); unsubscribeTransactions = null; }
        if (unsubscribeInventory) { unsubscribeInventory(); unsubscribeInventory = null; }
      }
    };
  }
}));
