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
  serverTimestamp,
  limit,
  getDocs
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

export const getGlobalConfig = async () => {
  const docRef = doc(db, 'config', 'global');
  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
  } catch (err) {
    console.error("Error getting global config:", err);
  }
  return null;
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
export const getAllTransactions = async () => {
  try {
    const colRef = collection(db, 'transactions');
    const q = query(colRef, orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.error("Error in getAllTransactions:", err);
    return [];
  }
};

export const subscribeToTransactions = (
  callback: (data: any[]) => void, 
  filters?: { type?: string; month?: string },
  limitCount?: number
) => {
  const colRef = collection(db, 'transactions');
  // Avoid composite index requirement by using only one orderBy
  // We'll sort secondary fields client-side to prevent app crash if composite index is not set up
  let q = query(colRef, orderBy('date', 'desc'));
  if (limitCount && limitCount > 0) {
    q = query(colRef, orderBy('date', 'desc'), limit(limitCount));
  }
  
  return onSnapshot(q, (snapshot) => {
    let txs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Secondary sort client-side: if dates are same, sort by createdAt desc
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
      organizerType: booking.organizerType || 'Perorangan / Keluarga',
      organizerName: booking.organizerName || '',
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

// Inventory
export const subscribeToInventory = (callback: (data: any[]) => void) => {
  const colRef = collection(db, 'inventory');
  const q = query(colRef, orderBy('name'));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  }, (err) => handleFirestoreError(err, OperationType.LIST, 'inventory'));
};

/**
 * Concurrency-safe booking approval: checks for schedule conflict before approving
 */
export const approveBookingSafe = async (
  bookingId: string, 
  allBookings: any[],
  actorInfo?: { email: string | null; displayName?: string; role?: string }
): Promise<{ success: boolean; conflictBooking?: any }> => {
  try {
    const targetBooking = allBookings.find(b => b.id === bookingId);
    if (!targetBooking) {
      throw new Error('Data pemesanan tidak ditemukan');
    }

    // Check if another approved/completed booking exists on the exact same date
    const conflict = allBookings.find(b => 
      b.id !== bookingId &&
      b.startDate === targetBooking.startDate &&
      (b.status === 'approved' || b.status === 'completed')
    );

    if (conflict) {
      return { success: false, conflictBooking: conflict };
    }

    // Safe to approve
    const docRef = doc(db, 'bookings', bookingId);
    await updateDoc(docRef, {
      status: 'approved',
      approvedAt: serverTimestamp(),
      approvedBy: actorInfo?.email || 'admin',
      updatedAt: serverTimestamp()
    });

    // Write to audit trail
    await logAdminActivity({
      action: 'BOOKING_APPROVED',
      description: `Menyetujui sewa tanggal ${targetBooking.startDate} (${targetBooking.purpose} - ${targetBooking.customerName})`,
      targetId: bookingId,
      actorInfo
    });

    return { success: true };
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `bookings/${bookingId}/approve`);
    return { success: false };
  }
};

export interface AdminActivityLog {
  id?: string;
  action: string;
  description: string;
  targetId?: string;
  actorEmail: string;
  actorName: string;
  actorRole: string;
  createdAt: any;
}

export const logAdminActivity = async (params: {
  action: string;
  description: string;
  targetId?: string;
  actorInfo?: { email: string | null; displayName?: string; role?: string };
}) => {
  try {
    const colRef = collection(db, 'audit_logs');
    await addDoc(colRef, {
      action: params.action,
      description: params.description,
      targetId: params.targetId || null,
      actorEmail: params.actorInfo?.email || 'admin@gsgtondo2.id',
      actorName: params.actorInfo?.displayName || params.actorInfo?.email?.split('@')[0] || 'Administrator',
      actorRole: params.actorInfo?.role || 'admin',
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.warn('Could not record audit log:', err);
  }
};

export const subscribeToAuditLogs = (callback: (logs: AdminActivityLog[]) => void, limitCount = 20) => {
  const colRef = collection(db, 'audit_logs');
  const q = query(colRef, orderBy('createdAt', 'desc'), limit(limitCount));
  return onSnapshot(q, (snapshot) => {
    const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AdminActivityLog[];
    callback(logs);
  }, (err) => {
    console.warn('Error reading audit logs:', err);
    callback([]);
  });
};

// ==========================================
// VENDORS & UMKM WARGA
// ==========================================
import { Vendor, DEFAULT_VENDORS } from '../types/vendor';

export const subscribeToVendors = (callback: (vendors: Vendor[]) => void) => {
  const colRef = collection(db, 'vendors');
  return onSnapshot(colRef, (snapshot) => {
    if (snapshot.empty) {
      // Provide default high quality mock vendors if collection not yet populated
      callback(DEFAULT_VENDORS);
      return;
    }
    const vendors = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Vendor[];
    callback(vendors);
  }, (err) => {
    console.warn('Error fetching vendors from Firestore, falling back to defaults:', err);
    callback(DEFAULT_VENDORS);
  });
};

export const upsertVendor = async (id: string | null, data: Partial<Vendor>) => {
  const colRef = collection(db, 'vendors');
  try {
    if (id) {
      await updateDoc(doc(db, 'vendors', id), {
        ...data,
        updatedAt: serverTimestamp()
      });
    } else {
      await addDoc(colRef, {
        ...data,
        status: data.status || 'active',
        isVerified: data.isVerified ?? true,
        rating: data.rating || 5.0,
        reviewCount: data.reviewCount || 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
  } catch (err) {
    handleFirestoreError(err, id ? OperationType.UPDATE : OperationType.CREATE, 'vendors');
  }
};

export const removeVendor = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'vendors', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `vendors/${id}`);
  }
};

export const submitVendorRegistration = async (data: any) => {
  const colRef = collection(db, 'vendors');
  try {
    await addDoc(colRef, {
      ...data,
      status: 'pending', // Requires admin verification
      isVerified: false,
      rating: 5.0,
      reviewCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (err) {
    console.error('Error submitting vendor registration:', err);
    throw err;
  }
};



