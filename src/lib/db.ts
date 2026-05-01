import { 
  collection, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  updateDoc, 
  addDoc, 
  deleteDoc,
  setDoc,
  Timestamp,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  console.error(`Firestore Error [${operationType}] on path [${path}]:`, error);
  throw error;
}

// Global Config / Settings
export const subscribeToConfig = (callback: (data: any) => void) => {
  const docRef = doc(db, 'config', 'global');
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data());
    } else {
      // Return default data without trying to write it
      callback({
        isAvailable: true,
        currentEvent: '',
        devFund: 'Rp 0',
        opsFund: 'Rp 0',
        devFundRate: 0.2,
        monthlyBudget: 5000000,
        updatedAt: Timestamp.now()
      });
    }
  }, (err) => handleFirestoreError(err, OperationType.GET, 'config/global'));
};

export const updateGlobalConfig = async (data: Partial<any>) => {
  const docRef = doc(db, 'config', 'global');
  try {
    await setDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now()
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, 'config/global');
  }
};

// Facilities
export const subscribeToFacilities = (callback: (data: any[]) => void) => {
  const colRef = collection(db, 'facilities');
  const q = query(colRef, orderBy('order', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const facilities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(facilities);
  }, (err) => handleFirestoreError(err, OperationType.LIST, 'facilities'));
};

export const upsertFacility = async (id: string | null, data: any) => {
  const colRef = collection(db, 'facilities');
  try {
    if (id) {
      await updateDoc(doc(db, 'facilities', id), data);
    } else {
      await addDoc(colRef, { ...data, createdAt: Timestamp.now() });
    }
  } catch (err) {
    handleFirestoreError(err, id ? OperationType.UPDATE : OperationType.CREATE, 'facilities');
  }
};

export const removeFacility = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'facilities', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, 'facilities');
  }
};

// Transactions
export const subscribeToTransactions = (callback: (data: any[]) => void, filters?: { type?: string; month?: string }) => {
  const colRef = collection(db, 'transactions');
  // Avoid composite index requirement by using only one orderBy
  // We'll sort secondary fields client-side if needed
  let q = query(colRef, orderBy('date', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    let txs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Secondary sort: if dates are same, sort by createdAt desc
    txs.sort((a: any, b: any) => {
      if (a.date > b.date) return -1;
      if (a.date < b.date) return 1;
      
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    });

    if (filters?.type && filters.type !== 'all') {
      txs = txs.filter((t: any) => t.type === filters.type);
    }
    
    if (filters?.month && filters.month !== 'all') {
      txs = txs.filter((t: any) => t.date.startsWith(filters.month));
    }

    callback(txs);
  }, (err) => handleFirestoreError(err, OperationType.LIST, 'transactions'));
};

export const syncFinanceTotals = async (txs: any[]) => {
  try {
    const totalDev = txs.reduce((acc, curr: any) => acc + (Number(curr.devFund) || 0), 0);
    const totalOps = txs.reduce((acc, curr: any) => acc + (Number(curr.ops) || 0), 0);
    
    await updateGlobalConfig({
      devFund: `Rp ${Math.floor(totalDev).toLocaleString('id-ID')}`,
      opsFund: `Rp ${Math.floor(totalOps).toLocaleString('id-ID')}`
    });
  } catch (err) {
    console.error("Sync error:", err);
  }
};

export const addTransaction = async (data: any, authorInfo?: { email: string | null; displayName?: string; role?: string }) => {
  const colRef = collection(db, 'transactions');
  try {
    await addDoc(colRef, {
      ...data,
      addedBy: authorInfo?.email || 'system',
      addedByName: authorInfo?.displayName || authorInfo?.email?.split('@')[0] || 'Administrator',
      addedByRole: authorInfo?.role || 'system',
      status: data.status || 'completed', // Default auto-complete
      createdAt: Timestamp.now()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'transactions');
  }
};

export const updateTransaction = async (id: string, updates: any) => {
  try {
    const docRef = doc(db, 'transactions', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `transactions/${id}`);
  }
};

export const removeTransaction = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'transactions', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, 'transactions');
  }
};

// Admins & Access Rules
export const subscribeToAdmins = (callback: (data: any[]) => void) => {
  const colRef = collection(db, 'admins');
  const q = query(colRef, orderBy('addedAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  }, (err) => handleFirestoreError(err, OperationType.LIST, 'admins'));
};

export const addAdminAccount = async (email: string, role: string, displayName?: string) => {
  try {
    const emailKey = email.toLowerCase();
    await setDoc(doc(db, 'admins', emailKey), {
      email: emailKey,
      role,
      displayName: displayName || emailKey.split('@')[0],
      addedAt: Timestamp.now()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'admins');
  }
};

export const updateAdminAccount = async (id: string, updates: any) => {
  try {
    const docRef = doc(db, 'admins', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `admins/${id}`);
  }
};

export const removeAdminAccount = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'admins', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, 'admins');
  }
};

// Bookings
export const subscribeToBookings = (callback: (data: any[]) => void) => {
  const colRef = collection(db, 'bookings');
  const q = query(colRef, orderBy('startDate', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  }, (err) => handleFirestoreError(err, OperationType.LIST, 'bookings'));
};

/**
 * Checks if a facility is currently in use based on its bookings and manual config
 * @param bookings List of all bookings
 * @param config System configuration
 * @param facilityId ID of the facility
 * @returns { isBusy: boolean, currentBooking: any | null, statusType: 'booking' | 'manual' | 'available' }
 */
export const checkCurrentAvailability = (bookings: any[], config: any, facilityId: string | 'all') => {
  // 1. Check for manual maintenance/block from config
  if (config?.manualStatus === 'maintenance') {
    return { isBusy: true, currentBooking: { purpose: config.manualStatusNote || 'Pemeliharaan Gedung' }, statusType: 'manual' };
  }

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // 2. Find confirmed bookings for today
  const activeBooking = bookings.find(b => {
    if (b.status !== 'approved' && b.status !== 'completed') return false;
    
    const bookingDate = b.startDate;
    const facilityMatch = facilityId === 'all' || b.facilityId === facilityId;
    
    return bookingDate === todayStr && facilityMatch;
  });

  if (activeBooking) {
    // Check for privacy
    const displayPurpose = activeBooking.isPublic !== false 
      ? activeBooking.purpose 
      : 'Acara Warga (Privat)';

    return { 
      isBusy: true, 
      currentBooking: { ...activeBooking, purpose: displayPurpose }, 
      statusType: 'booking' 
    };
  }

  return {
    isBusy: false,
    currentBooking: null,
    statusType: 'available'
  };
};

export const addBooking = async (data: any) => {
  const colRef = collection(db, 'bookings');
  try {
    await addDoc(colRef, {
      ...data,
      status: data.status || 'pending',
      paymentStatus: data.paymentStatus || 'unpaid',
      createdAt: Timestamp.now()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'bookings');
  }
};

export const updateBookingStatus = async (id: string, updates: any) => {
  try {
    const docRef = doc(db, 'bookings', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `bookings/${id}`);
  }
};

export const removeBooking = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'bookings', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, 'bookings');
  }
};

// Integration: Booking to Finance
export const recordBookingToFinance = async (booking: any, authorInfo?: { email: string | null; displayName?: string; role?: string }) => {
  try {
    const configDoc = await getDoc(doc(db, 'config', 'global'));
    const devFundRate = configDoc.exists() ? (configDoc.data().devFundRate || 0.2) : 0.2;
    
    const amount = Number(booking.amount) || 0;
    const devFund = amount * devFundRate;
    const ops = amount - devFund;

    // 1. Create Transaction
    const txRef = collection(db, 'transactions');
    await addDoc(txRef, {
      date: booking.startDate,
      source: `Sewa: ${booking.purpose} (${booking.customerName})`,
      type: 'income',
      amount: amount,
      devFund: devFund,
      ops: ops,
      category: 'sewa',
      allocationMode: 'auto',
      expenseSource: 'ops', // Default placeholder for income
      status: 'completed',
      bookingId: booking.id,
      addedBy: authorInfo?.email || 'system',
      addedByName: authorInfo?.displayName || authorInfo?.email?.split('@')[0] || 'Administrator',
      addedByRole: authorInfo?.role || 'system',
      createdAt: Timestamp.now()
    });

    // 2. Update Booking
    await updateDoc(doc(db, 'bookings', booking.id), {
      financeAdded: true,
      paymentStatus: 'paid',
      updatedAt: serverTimestamp()
    });

  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'integration/booking-finance');
  }
};
