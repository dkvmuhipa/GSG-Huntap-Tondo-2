import { create } from 'zustand';
import { 
  subscribeToConfig, 
  subscribeToFacilities, 
  subscribeToBookings, 
  subscribeToAdmins, 
  subscribeToTransactions,
  subscribeToInventory,
  subscribeToVendors
} from '../lib/db';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Vendor, DEFAULT_VENDORS } from '../types/vendor';

interface AppState {
  config: any;
  facilities: any[];
  bookings: any[];
  admins: any[];
  transactions: any[];
  inventory: any[];
  vendors: Vendor[];
  
  // Loaded indicators
  isConfigLoaded: boolean;
  isFacilitiesLoaded: boolean;
  isBookingsLoaded: boolean;
  isAdminsLoaded: boolean;
  isTransactionsLoaded: boolean;
  isInventoryLoaded: boolean;
  isVendorsLoaded: boolean;

  // Setters
  setConfig: (config: any) => void;
  setFacilities: (facilities: any[]) => void;
  setBookings: (bookings: any[]) => void;
  setAdmins: (admins: any[]) => void;
  setTransactions: (transactions: any[]) => void;
  setInventory: (inventory: any[]) => void;
  setVendors: (vendors: Vendor[]) => void;

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
let unsubscribeVendors: (() => void) | null = null;
let unsubscribeAuth: (() => void) | null = null;
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
  vendors: DEFAULT_VENDORS,

  isConfigLoaded: false,
  isFacilitiesLoaded: false,
  isBookingsLoaded: false,
  isAdminsLoaded: false,
  isTransactionsLoaded: false,
  isInventoryLoaded: false,
  isVendorsLoaded: false,

  setConfig: (config) => set({ config, isConfigLoaded: true }),
  setFacilities: (facilities) => set({ facilities, isFacilitiesLoaded: true }),
  setBookings: (bookings) => set({ bookings, isBookingsLoaded: true }),
  setAdmins: (admins) => set({ admins, isAdminsLoaded: true }),
  setTransactions: (transactions) => set({ transactions, isTransactionsLoaded: true }),
  setInventory: (inventory) => set({ inventory, isInventoryLoaded: true }),
  setVendors: (vendors) => set({ vendors, isVendorsLoaded: true }),

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
      if (!unsubscribeTransactions) {
        unsubscribeTransactions = subscribeToTransactions((data) => {
          set({ transactions: data, isTransactionsLoaded: true });
        });
      }
      if (!unsubscribeVendors) {
        unsubscribeVendors = subscribeToVendors((data) => {
          set({ vendors: data, isVendorsLoaded: true });
        });
      }

      // Dynamic listener for admin-only data using Firebase Auth state
      if (!unsubscribeAuth) {
        unsubscribeAuth = onAuthStateChanged(auth, (user) => {
          if (user) {
            // Logged in: subscribe to admin-only collections
            if (!unsubscribeAdmins) {
              unsubscribeAdmins = subscribeToAdmins((data) => {
                set({ admins: data, isAdminsLoaded: true });
              });
            }
            if (!unsubscribeInventory) {
              unsubscribeInventory = subscribeToInventory((data) => {
                set({ inventory: data, isInventoryLoaded: true });
              });
            }
          } else {
            // Logged out: clean up admin subscriptions to prevent "Missing or insufficient permissions"
            if (unsubscribeAdmins) { unsubscribeAdmins(); unsubscribeAdmins = null; }
            if (unsubscribeInventory) { unsubscribeInventory(); unsubscribeInventory = null; }
            set({ admins: [], isAdminsLoaded: false, inventory: [], isInventoryLoaded: false });
          }
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
        if (unsubscribeTransactions) { unsubscribeTransactions(); unsubscribeTransactions = null; }
        if (unsubscribeVendors) { unsubscribeVendors(); unsubscribeVendors = null; }
        
        if (unsubscribeAdmins) { unsubscribeAdmins(); unsubscribeAdmins = null; }
        if (unsubscribeInventory) { unsubscribeInventory(); unsubscribeInventory = null; }
        if (unsubscribeAuth) { unsubscribeAuth(); unsubscribeAuth = null; }
      }
    };
  }
}));
