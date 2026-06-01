'use server';

import prisma from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './api/auth/[...nextauth]/route';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
// mail module removed

// --- IAM Permission Helper ---
async function checkAuth(allowedRoles = []) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error("UNAUTHORIZED: Active session required.");
  }
  const role = session.user.role;
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    throw new Error(`UNAUTHORIZED: Role ${role} does not have permission to execute this operation.`);
  }
  return session.user;
}

// --- Audit Logger Helper ---
async function writeAudit(userId, action, tableName, recordId, oldState, newState, remarks) {
  try {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role || null;
    await prisma.auditLog.create({
      data: {
        userId,
        role,
        action,
        tableName,
        recordId,
        oldState: oldState ? JSON.parse(JSON.stringify(oldState)) : null,
        newState: newState ? JSON.parse(JSON.stringify(newState)) : null,
        remarks
      }
    });
  } catch (error) {
    console.error('Audit log failed:', error.message);
  }
}

// ----------------------------------------------------
// 1. Get Dashboard & Ledger Data
// ----------------------------------------------------
export async function getDashboardData() {
  try {
    const user = await checkAuth([]);
    const isAdminOrManager = ['ADMIN', 'MANAGER', 'ACCOUNTANT', 'AUDITOR'].includes(user.role);

    // Fetch Inventory
    const inventory = await prisma.inventory.findMany();
    const domesticInv = inventory.find(i => i.cylinderType === 'DOMESTIC_14_2') || { filledStock: 0, emptyStock: 0, damagedStock: 0, leakageStock: 0 };
    const commercialInv = inventory.find(i => i.cylinderType === 'COMMERCIAL_19') || { filledStock: 0, emptyStock: 0, damagedStock: 0, leakageStock: 0 };

    // Check if opening stock has been initialized
    const openingStockTx = await prisma.inventoryTransaction.findFirst({
      where: { eventType: 'OPENING_STOCK' }
    });
    const isInitialized = !!openingStockTx;

    const employees = await prisma.employee.findMany({ where: { isActive: true } });
    const customers = await prisma.customer.findMany();
    
    let commercialLedger = [];
    let dailyClosings = [];
    let incidents = [];
    let expenses = [];
    let loads = [];
    let deliveries = [];
    let invoices = [];
    let invites = [];
    let connections = [];
    let emptyReturns = [];
    let payments = [];
    let verificationQueue = [];
    let regulatorReturns = [];
    let hosePipeTransactions = [];
    let kycCardBookTransactions = [];
    let auditorVerifications = [];
    let loadCycles = [];
    let monthlyArchives = [];
    let activeLoadCycle = null;

    if (isAdminOrManager) {
      commercialLedger = await prisma.commercialLedger.findMany({ orderBy: { createdAt: 'desc' } });
      dailyClosings = await prisma.dailyClosing.findMany({ orderBy: { closingDate: 'desc' }, take: 10 });
      incidents = await prisma.cylinderIncident.findMany({ orderBy: { incidentDate: 'desc' } });
      expenses = await prisma.expense.findMany({ orderBy: { expenseDate: 'desc' } });
      loads = await prisma.load.findMany({ include: { loadItems: true }, orderBy: { arrivalDate: 'desc' } });
      deliveries = await prisma.delivery.findMany({ include: { deliveryItems: true }, orderBy: { deliveryDate: 'desc' } });
      invoices = await prisma.invoice.findMany({ orderBy: { invoiceDate: 'desc' } });
      invites = await prisma.invite.findMany({ orderBy: { createdAt: 'desc' } });
      connections = await prisma.customerConnection.findMany({ include: { customer: true }, orderBy: { connectionDate: 'desc' } });
      emptyReturns = await prisma.emptyReturn.findMany({ include: { customer: true }, orderBy: { returnDate: 'desc' } });
      payments = await prisma.payment.findMany({ include: { customer: true }, orderBy: { paymentDate: 'desc' } });
      regulatorReturns = await prisma.regulatorReturn.findMany({ include: { customer: true, staff: true }, orderBy: { returnDate: 'desc' } });
      hosePipeTransactions = await prisma.hosePipeTransaction.findMany({ include: { customer: true, staff: true }, orderBy: { txDate: 'desc' } });
      kycCardBookTransactions = await prisma.kycCardBookTransaction.findMany({ orderBy: { txDate: 'desc' } });
      auditorVerifications = await prisma.auditorVerification.findMany({ orderBy: { verificationDate: 'desc' } });
      loadCycles = await prisma.loadCycle.findMany({ orderBy: { createdAt: 'desc' } });
      monthlyArchives = await prisma.monthlyArchive.findMany({ orderBy: { createdAt: 'desc' } });
      activeLoadCycle = loadCycles.find(lc => lc.status === 'active') || null;

      // Build unified verification queue
      const pendingDeliveries = await prisma.delivery.findMany({
        where: { verificationStatus: 'PENDING' },
        include: { customer: true, deliveryItems: true }
      });
      const pendingConnections = await prisma.customerConnection.findMany({
        where: { verificationStatus: 'PENDING' },
        include: { customer: true }
      });
      const pendingReturns = await prisma.emptyReturn.findMany({
        where: { verificationStatus: 'PENDING' },
        include: { customer: true }
      });
      const pendingPayments = await prisma.payment.findMany({
        where: { verificationStatus: 'PENDING' },
        include: { customer: true }
      });
      const pendingIncidents = await prisma.cylinderIncident.findMany({
        where: { verificationStatus: 'PENDING' }
      });

      verificationQueue = [
        ...pendingDeliveries.map(d => ({ ...d, type: 'DELIVERY' })),
        ...pendingConnections.map(c => ({ ...c, type: 'CONNECTION' })),
        ...pendingReturns.map(r => ({ ...r, type: 'EMPTY_RETURN' })),
        ...pendingPayments.map(p => ({ ...p, type: 'PAYMENT' })),
        ...pendingIncidents.map(i => ({ ...i, type: 'INCIDENT' }))
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else {
      // Employee role limits: only own logs
      deliveries = await prisma.delivery.findMany({ 
        where: { remarks: { contains: `Logged by ${user.name}` } },
        include: { deliveryItems: true }, 
        orderBy: { deliveryDate: 'desc' }
      });
      incidents = await prisma.cylinderIncident.findMany({ 
        where: { remarks: { contains: `Logged by ${user.name}` } },
        orderBy: { incidentDate: 'desc' }
      });
      connections = await prisma.customerConnection.findMany({
        where: { remarks: { contains: `Logged by ${user.name}` } },
        include: { customer: true },
        orderBy: { connectionDate: 'desc' }
      });
      emptyReturns = await prisma.emptyReturn.findMany({
        where: { remarks: { contains: `Logged by ${user.name}` } },
        include: { customer: true },
        orderBy: { returnDate: 'desc' }
      });
      payments = await prisma.payment.findMany({
        where: { remarks: { contains: `Logged by ${user.name}` } },
        include: { customer: true },
        orderBy: { paymentDate: 'desc' }
      });
      regulatorReturns = await prisma.regulatorReturn.findMany({
        where: { staff: { name: user.name } },
        include: { customer: true, staff: true },
        orderBy: { returnDate: 'desc' }
      });
      hosePipeTransactions = await prisma.hosePipeTransaction.findMany({
        where: { staff: { name: user.name } },
        include: { customer: true, staff: true },
        orderBy: { txDate: 'desc' }
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayCashCollection = deliveries
      .filter(d => new Date(d.deliveryDate) >= today && d.verificationStatus === 'APPROVED')
      .reduce((sum, d) => sum + d.amountReceived, 0) + 
      payments
      .filter(p => new Date(p.paymentDate) >= today && p.verificationStatus === 'APPROVED')
      .reduce((sum, p) => sum + p.amount, 0);

    const pendingCommercialAmount = commercialLedger
      .filter(l => l.status !== 'clear')
      .reduce((sum, l) => sum + l.amountPending, 0);

    const pendingCommercialEmpties = commercialLedger
      .filter(l => l.status !== 'clear')
      .reduce((sum, l) => sum + l.emptyPending, 0);

    const staffPaymentsToday = expenses
      .filter(e => new Date(e.expenseDate) >= today && e.category === 'labor_wage')
      .reduce((sum, e) => sum + e.amount, 0);

    const totalLpgWeight = (domesticInv.filledStock * 14.2) + (commercialInv.filledStock * 19.0);

    const todayDeliveriesCount = deliveries
      .filter(d => new Date(d.deliveryDate) >= today && d.verificationStatus === 'APPROVED')
      .length;

    const eKycCountToday = kycCardBookTransactions
      .filter(t => t.type === 'EKYC' && new Date(t.txDate) >= today)
      .reduce((sum, t) => sum + t.count, 0);

    const lpgCardBookCountToday = kycCardBookTransactions
      .filter(t => t.type === 'CARDBOOK' && new Date(t.txDate) >= today)
      .reduce((sum, t) => sum + t.count, 0);

    const regulatorReturnsCount = regulatorReturns.length;
    const hosePipeReturnsCount = hosePipeTransactions
      .filter(t => t.type === 'RETURN')
      .reduce((sum, t) => sum + t.quantity, 0);

    return {
      success: true,
      data: {
        isInitialized,
        inventory: {
          domestic: domesticInv,
          commercial: commercialInv
        },
        employees,
        customers,
        commercialLedger,
        dailyClosings,
        incidents,
        expenses,
        loads,
        deliveries,
        invoices,
        invites,
        connections,
        emptyReturns,
        payments,
        verificationQueue,
        regulatorReturns,
        hosePipeTransactions,
        kycCardBookTransactions,
        auditorVerifications,
        loadCycles,
        monthlyArchives,
        activeLoadCycle,
        kpis: {
          todayCashCollection,
          pendingCommercialAmount,
          pendingCommercialEmpties,
          staffPaymentsToday,
          problemCylinders: domesticInv.damagedStock + domesticInv.leakageStock + commercialInv.damagedStock + commercialInv.leakageStock,
          totalLpgWeight,
          todayDeliveriesCount,
          eKycCountToday,
          lpgCardBookCountToday,
          regulatorReturnsCount,
          hosePipeReturnsCount
        }
      }
    };
  } catch (error) {
    console.error('getDashboardData error:', error.message);
    return { success: false, error: error.message };
  }
}

// ----------------------------------------------------
// 1.5 Initialize Opening Stock (ADMIN / AUDITOR only)
// ----------------------------------------------------
export async function initializeOpeningStock(data) {
  try {
    const user = await checkAuth(['ADMIN', 'AUDITOR']);
    const schema = z.object({
      date: z.string().min(1, "Date is required"),
      filled14: z.number().int().nonnegative(),
      empty14: z.number().int().nonnegative(),
      filled19: z.number().int().nonnegative(),
      empty19: z.number().int().nonnegative(),
      regulators: z.number().int().nonnegative().optional(),
      hosePipes: z.number().int().nonnegative().optional(),
      openingCash: z.number().nonnegative().optional(),
      remarks: z.string().optional()
    });

    const parsed = schema.parse(data);

    await prisma.$transaction(async (tx) => {
      // Upsert Domestic 14.2 kg
      await tx.inventory.upsert({
        where: { cylinderType: 'DOMESTIC_14_2' },
        update: {
          filledStock: parsed.filled14,
          emptyStock: parsed.empty14,
          damagedStock: 0,
          leakageStock: 0
        },
        create: {
          cylinderType: 'DOMESTIC_14_2',
          filledStock: parsed.filled14,
          emptyStock: parsed.empty14,
          damagedStock: 0,
          leakageStock: 0
        }
      });

      // Upsert Commercial 19 kg
      await tx.inventory.upsert({
        where: { cylinderType: 'COMMERCIAL_19' },
        update: {
          filledStock: parsed.filled19,
          emptyStock: parsed.empty19,
          damagedStock: 0,
          leakageStock: 0
        },
        create: {
          cylinderType: 'COMMERCIAL_19',
          filledStock: parsed.filled19,
          emptyStock: parsed.empty19,
          damagedStock: 0,
          leakageStock: 0
        }
      });

      // Create transaction logs
      await tx.inventoryTransaction.create({
        data: {
          transactionDate: new Date(parsed.date),
          eventType: 'OPENING_STOCK',
          cylinderType: 'DOMESTIC_14_2',
          filledChange: parsed.filled14,
          emptyChange: parsed.empty14,
          remarks: `Opening Stock Initialized (14.2 kg): ${parsed.remarks || ''}`
        }
      });

      await tx.inventoryTransaction.create({
        data: {
          transactionDate: new Date(parsed.date),
          eventType: 'OPENING_STOCK',
          cylinderType: 'COMMERCIAL_19',
          filledChange: parsed.filled19,
          emptyChange: parsed.empty19,
          remarks: `Opening Stock Initialized (19 kg): ${parsed.remarks || ''}`
        }
      });
    });

    await writeAudit(
      user.id,
      'ADJUSTMENT',
      'inventory',
      'N/A',
      null,
      parsed,
      `Opening Stock Initialized: 14.2kg Filled=${parsed.filled14}, Empty=${parsed.empty14}; 19kg Filled=${parsed.filled19}, Empty=${parsed.empty19}`
    );

    revalidatePath('/');
    return { success: true, message: 'Opening Stock successfully initialized!' };
  } catch (error) {
    console.error('initializeOpeningStock error:', error.message);
    return { success: false, error: error.message };
  }
}

// ----------------------------------------------------
// 2. Submit Incoming Load (ADMIN / MANAGER only)
// ----------------------------------------------------
const LoadSchema = z.object({
  loadNumber: z.string().min(1, "Load reference is required"),
  arrivalDate: z.string().min(1, "Date is required"),
  vehicleNumber: z.string().min(1, "Vehicle number is required"),
  pattern: z.enum(['DOMESTIC_ONLY', 'MIXED_COMMERCIAL', 'CUSTOM']),
  totalCylinders: z.number().int().positive(),
  domesticFilled: z.number().int().nonnegative(),
  commercialFilled: z.number().int().nonnegative(),
  emptyReturned: z.number().int().nonnegative(),
  damagedFound: z.number().int().nonnegative(),
  leakageFound: z.number().int().nonnegative(),
  laborPayment: z.number().nonnegative(),
  remarks: z.string().optional(),
  staffNames: z.string().optional()
});

export async function submitLoad(data) {
  try {
    const user = await checkAuth(['ADMIN', 'MANAGER']);
    const parsed = LoadSchema.parse(data);

    const result = await prisma.$transaction(async (tx) => {
      const load = await tx.load.create({
        data: {
          loadNumber: parsed.loadNumber,
          arrivalDate: new Date(parsed.arrivalDate),
          vehicleNumber: parsed.vehicleNumber,
          pattern: parsed.pattern,
          totalCylinders: parsed.totalCylinders,
          unloadingPayment: parsed.laborPayment,
          remarks: parsed.remarks
        }
      });

      if (parsed.domesticFilled > 0 || parsed.emptyReturned > 0) {
        await tx.loadItem.create({
          data: {
            loadId: load.id,
            cylinderType: 'DOMESTIC_14_2',
            filledReceived: parsed.domesticFilled,
            emptyReturned: parsed.emptyReturned,
            damagedDetected: parsed.damagedFound,
            leakageDetected: parsed.leakageFound
          }
        });

        await tx.inventory.update({
          where: { cylinderType: 'DOMESTIC_14_2' },
          data: {
            filledStock: { increment: parsed.domesticFilled - (parsed.damagedFound + parsed.leakageFound) },
            emptyStock: { decrement: parsed.emptyReturned },
            damagedStock: { increment: parsed.damagedFound },
            leakageStock: { increment: parsed.leakageFound }
          }
        });

        await tx.inventoryTransaction.create({
          data: {
            transactionDate: new Date(parsed.arrivalDate),
            eventType: 'LOAD_RECEIVED',
            referenceId: load.id,
            cylinderType: 'DOMESTIC_14_2',
            filledChange: parsed.domesticFilled - (parsed.damagedFound + parsed.leakageFound),
            emptyChange: -parsed.emptyReturned,
            damagedChange: parsed.damagedFound,
            leakageChange: parsed.leakageFound,
            remarks: `Load ${parsed.loadNumber} check-in`
          }
        });
      }

      if (parsed.commercialFilled > 0) {
        await tx.loadItem.create({
          data: {
            loadId: load.id,
            cylinderType: 'COMMERCIAL_19',
            filledReceived: parsed.commercialFilled,
            emptyReturned: 0,
            damagedDetected: 0,
            leakageDetected: 0
          }
        });

        await tx.inventory.update({
          where: { cylinderType: 'COMMERCIAL_19' },
          data: {
            filledStock: { increment: parsed.commercialFilled }
          }
        });

        await tx.inventoryTransaction.create({
          data: {
            transactionDate: new Date(parsed.arrivalDate),
            eventType: 'LOAD_RECEIVED',
            referenceId: load.id,
            cylinderType: 'COMMERCIAL_19',
            filledChange: parsed.commercialFilled,
            remarks: `Load ${parsed.loadNumber} check-in (commercial)`
          }
        });
      }

      if (parsed.laborPayment > 0) {
        await tx.expense.create({
          data: {
            expenseDate: new Date(parsed.arrivalDate),
            category: 'labor_wage',
            amount: parsed.laborPayment,
            paidTo: `Labor Crew (${parsed.staffNames || 'General'})`,
            paymentMode: 'CASH',
            referenceId: load.id,
            remarks: `Unloading labor wage load: ${parsed.loadNumber}`
          }
        });
      }

      // Load Cycle Lifecycle Integration
      const inventory = await tx.inventory.findMany();
      const domesticInv = inventory.find(i => i.cylinderType === 'DOMESTIC_14_2') || { filledStock: 0, emptyStock: 0 };
      const commercialInv = inventory.find(i => i.cylinderType === 'COMMERCIAL_19') || { filledStock: 0, emptyStock: 0 };

      // Close active cycles
      await tx.loadCycle.updateMany({
        where: { status: 'active' },
        data: {
          status: 'closed',
          closedAt: new Date(),
          closingBalance: `Domestic Filled: ${domesticInv.filledStock}, Empty: ${domesticInv.emptyStock}; Commercial Filled: ${commercialInv.filledStock}, Empty: ${commercialInv.emptyStock}`
        }
      });

      // Start new cycle for the newly received load
      await tx.loadCycle.create({
        data: {
          loadNumber: parsed.loadNumber,
          loadDate: new Date(parsed.arrivalDate),
          loadType: parsed.pattern === 'DOMESTIC_ONLY' ? 'DOMESTIC' : (parsed.pattern === 'MIXED_COMMERCIAL' ? 'MIXED' : 'COMMERCIAL'),
          openingStock: `Domestic Filled: ${domesticInv.filledStock}, Empty: ${domesticInv.emptyStock}; Commercial Filled: ${commercialInv.filledStock}, Empty: ${commercialInv.emptyStock}`,
          cylindersReceived: parsed.domesticFilled + parsed.commercialFilled,
          emptyReturns: parsed.emptyReturned,
          status: 'active'
        }
      });

      return load;
    });

    await writeAudit(user.id, 'INSERT', 'loads', result.id, null, { loadNumber: parsed.loadNumber }, `Load check-in logged.`);
    
    revalidatePath('/');
    return { success: true, message: `Load ${parsed.loadNumber} successfully registered, active Load Cycle initiated.` };
  } catch (error) {
    console.error('submitLoad action error:', error.message);
    return { success: false, error: error.message };
  }
}

const DeliverySchema = z.object({
  deliveryDate: z.string().min(1, "Date is required"),
  customerId: z.string().nullable().optional(),
  customerName: z.string().min(1, "Customer name is required"),
  consumerNumber: z.string().optional(),
  mobileNumber: z.string().optional(),
  address: z.string().optional(),
  employeeId: z.string().min(1, "Staff is required"),
  cylinderType: z.enum(['DOMESTIC_14_2', 'COMMERCIAL_19']),
  quantityDelivered: z.number().int().positive(),
  emptyReturned: z.number().int().nonnegative(),
  paymentMode: z.enum(['CASH', 'UPI', 'CREDIT']),
  amountReceived: z.number().nonnegative(),
  ratePerCylinder: z.number().positive(),
  dacCode: z.string().refine(val => !val || /^\d{6}$/.test(val), {
    message: "Distributor Authorised Code (DAC) must be exactly 6 digits and numeric only"
  }).optional(),
  dacVerified: z.boolean().default(false),
  remarks: z.string().optional()
});

export async function submitDelivery(data) {
  try {
    const user = await checkAuth([]);
    const parsed = DeliverySchema.parse(data);

    const totalAmount = parsed.quantityDelivered * parsed.ratePerCylinder;
    const paymentStatus = parsed.amountReceived >= totalAmount ? 'paid' : (parsed.amountReceived > 0 ? 'partial' : 'pending_credit');

    const isEmployee = user.role === 'EMPLOYEE';
    const verificationStatus = isEmployee ? 'PENDING' : 'APPROVED';

    // Retrieve active load cycle if any
    const activeLoadCycle = await prisma.loadCycle.findFirst({
      where: { status: 'active' }
    });

    const result = await prisma.$transaction(async (tx) => {
      const delivery = await tx.delivery.create({
        data: {
          deliveryDate: new Date(parsed.deliveryDate),
          customerId: parsed.customerId || null,
          customerName: parsed.customerName,
          consumerNumber: parsed.consumerNumber || null,
          mobileNumber: parsed.mobileNumber || null,
          address: parsed.address || null,
          employeeId: parsed.employeeId,
          paymentStatus,
          totalAmount,
          amountReceived: parsed.amountReceived,
          amountPending: totalAmount - parsed.amountReceived,
          remarks: `${parsed.remarks || ''} (Logged by ${user.name})`,
          verificationStatus,
          loadCycleId: activeLoadCycle?.id || null
        }
      });

      await tx.deliveryItem.create({
        data: {
          deliveryId: delivery.id,
          cylinderType: parsed.cylinderType,
          quantityDelivered: parsed.quantityDelivered,
          emptyReturned: parsed.emptyReturned,
          dacCode: parsed.dacCode || null,
          dacVerified: parsed.dacVerified,
          ratePerCylinder: parsed.ratePerCylinder,
          lineTotal: totalAmount
        }
      });

      // Real-time Stock Reduction Logic
      const currentStock = await tx.inventory.findUnique({
        where: { cylinderType: parsed.cylinderType }
      });
      if (!currentStock || currentStock.filledStock < parsed.quantityDelivered) {
        throw new Error(`Insufficient stock available. Current stock: ${currentStock?.filledStock || 0} cylinders.`);
      }

      await tx.inventory.update({
        where: { cylinderType: parsed.cylinderType },
        data: {
          filledStock: { decrement: parsed.quantityDelivered },
          emptyStock: { increment: parsed.emptyReturned }
        }
      });

      await tx.inventoryTransaction.create({
        data: {
          transactionDate: new Date(parsed.deliveryDate),
          eventType: 'DELIVERY',
          referenceId: delivery.id,
          cylinderType: parsed.cylinderType,
          filledChange: -parsed.quantityDelivered,
          emptyChange: parsed.emptyReturned,
          remarks: `Billing refill entry to customer`
        }
      });

      if (parsed.cylinderType === 'COMMERCIAL_19' || parsed.paymentMode === 'CREDIT') {
        const ledgerStatus = parsed.amountReceived >= totalAmount ? 'clear' : (parsed.amountReceived > 0 ? 'partially_clear' : 'pending');
        
        await tx.commercialLedger.create({
          data: {
            customerId: parsed.customerId || null,
            customerName: parsed.customerName,
            consumerNumber: parsed.consumerNumber || null,
            mobileNumber: parsed.mobileNumber || null,
            address: parsed.address || null,
            deliveryId: delivery.id,
            cylinderType: parsed.cylinderType,
            quantityDelivered: parsed.quantityDelivered,
            emptyReturned: parsed.emptyReturned,
            emptyPending: parsed.quantityDelivered - parsed.emptyReturned,
            amountBilled: totalAmount,
            amountReceived: parsed.amountReceived,
            amountPending: totalAmount - parsed.amountReceived,
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            status: ledgerStatus
          }
        });
      }

      // Increment active load cycle counters
      if (activeLoadCycle) {
        await tx.loadCycle.update({
          where: { id: activeLoadCycle.id },
          data: {
            deliveriesCompleted: { increment: parsed.quantityDelivered },
            emptyReturns: { increment: parsed.emptyReturned }
          }
        });
      }

      return delivery;
    });

    await writeAudit(user.id, 'INSERT', 'deliveries', result.id, null, { customerName: parsed.customerName }, `Delivery logged (${verificationStatus}).`);

    revalidatePath('/');
    return { 
      success: true, 
      message: isEmployee 
        ? 'Delivery billing successfully logged. Pending Admin verification.' 
        : 'Delivery billing successfully logged.' 
    };
  } catch (error) {
    console.error('submitDelivery action error:', error.message);
    return { success: false, error: error.message };
  }
}


// ----------------------------------------------------
// 4. Invite Employee (ADMIN only)
// ----------------------------------------------------
const InviteSchema = z.object({
  name: z.string().min(1, "Employee Name is required"),
  email: z.string().email("Valid email address is required"),
  phone: z.string().min(10, "Phone number is required"),
  role: z.enum(['ADMIN', 'MANAGER', 'EMPLOYEE', 'ACCOUNTANT', 'AUDITOR'])
});

export async function inviteEmployee(data) {
  try {
    const user = await checkAuth(['ADMIN']);
    const parsed = InviteSchema.parse(data);

    // Check if user already exists
    const userExists = await prisma.user.findUnique({
      where: { username: parsed.email }
    });
    if (userExists) {
      throw new Error("A user account with this email address already exists.");
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days invite expiry

    const invite = await prisma.invite.upsert({
      where: { email: parsed.email },
      update: {
        name: parsed.name,
        phone: parsed.phone,
        role: parsed.role,
        token,
        expiresAt: expiry,
        isUsed: false
      },
      create: {
        email: parsed.email,
        name: parsed.name,
        phone: parsed.phone,
        role: parsed.role,
        token,
        expiresAt: expiry
      }
    });

    // Create a matching disabled Employee record if it doesn't exist
    await prisma.employee.upsert({
      where: { mobile: parsed.phone },
      update: { name: parsed.name, role: parsed.role.toLowerCase(), isActive: false },
      create: { name: parsed.name, role: parsed.role.toLowerCase(), mobile: parsed.phone, isActive: false }
    });

    // Email link trigger via Mailtrap removed
    const inviteLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/activate?token=${token}`;
    console.log("Mock Employee Invite Link:", inviteLink);

    await writeAudit(user.id, 'INSERT', 'invites', invite.id, null, { email: parsed.email }, `Employee invited.`);

    revalidatePath('/');
    return { success: true, inviteLink, message: `Employee successfully invited. Onboarding Link: ${inviteLink}` };
  } catch (error) {
    console.error('inviteEmployee error:', error.message);
    return { success: false, error: error.message };
  }
}

// ----------------------------------------------------
// 5. Activate Employee Account (Invite link callback)
// ----------------------------------------------------
const ActivationSchema = z.object({
  token: z.string().min(1, "Invite token is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6)
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

export async function activateEmployee(data) {
  try {
    const parsed = ActivationSchema.parse(data);

    // Validate invite record
    const invite = await prisma.invite.findUnique({
      where: { token: parsed.token }
    });

    if (!invite || invite.isUsed || new Date() > invite.expiresAt) {
      throw new Error("The invitation link is invalid or has expired.");
    }

    const passwordHash = bcrypt.hashSync(parsed.password, 10);

    await prisma.$transaction(async (tx) => {
      // Create user account
      await tx.user.create({
        data: {
          username: invite.email,
          passwordHash,
          name: invite.name,
          role: invite.role,
          isActive: true
        }
      });

      // Mark invite as used
      await tx.invite.update({
        where: { id: invite.id },
        data: { isUsed: true }
      });

      // Enable Employee record
      await tx.employee.update({
        where: { mobile: invite.phone },
        data: { isActive: true }
      });
    });

    return { success: true, message: "Account successfully activated! You can now sign in." };
  } catch (error) {
    console.error('activateEmployee error:', error.message);
    return { success: false, error: error.message };
  }
}

// ----------------------------------------------------
// 6. Create Customer (ADMIN / MANAGER only)
// ----------------------------------------------------
const CustomerSchema = z.object({
  name: z.string().min(1, "Customer Name is required"),
  consumerNumber: z.string().optional(),
  mobile: z.string().optional(),
  address: z.string().optional(),
  customerType: z.enum(['domestic', 'commercial', 'institutional', 'industrial']),
  creditAllowed: z.boolean().default(false)
});

export async function createCustomer(data) {
  try {
    const user = await checkAuth(['ADMIN', 'MANAGER']);
    const parsed = CustomerSchema.parse(data);

    const customer = await prisma.customer.create({
      data: {
        name: parsed.name,
        consumerNumber: parsed.consumerNumber || null,
        mobile: parsed.mobile || null,
        address: parsed.address || null,
        customerType: parsed.customerType,
        creditAllowed: parsed.creditAllowed
      }
    });

    await writeAudit(user.id, 'INSERT', 'customers', customer.id, null, { name: parsed.name }, `Customer profile created.`);

    revalidatePath('/');
    return { success: true, message: `Customer profile for ${parsed.name} created.` };
  } catch (error) {
    console.error('createCustomer error:', error.message);
    return { success: false, error: error.message };
  }
}

// ----------------------------------------------------
// 6.5. Issue New Connection (ADMIN / MANAGER only)
// ----------------------------------------------------
const ConnectionSchema = z.object({
  customerName: z.string().min(1, "Applicant Name is required"),
  mobile: z.string().min(10, "Valid mobile is required"),
  address: z.string().min(1, "Address is required"),
  connectionType: z.enum(['SINGLE_BOTTLE', 'DOUBLE_BOTTLE']),
  relationshipId: z.string().optional(),
  upgradeType: z.string().min(1, "Upgrade type is required"),
  stoveIncluded: z.boolean().default(false),
  regulatorIncluded: z.boolean().default(false),
  hosePipeIncluded: z.boolean().default(false),
  lpgCardBookRequired: z.boolean().default(false),
  eKycDone: z.boolean().default(false),
  eKycCharges: z.number().nonnegative().default(0),
  lpgCardBookCharges: z.number().nonnegative().default(0),
  totalAmount: z.number().nonnegative(),
  amountPaid: z.number().nonnegative(),
  paymentMode: z.string().optional(),
  staffId: z.string().min(1, "Staff is required"),
  connectionDate: z.string().min(1, "Date is required"),
  remarks: z.string().optional()
});

export async function submitConnection(data) {
  try {
    const user = await checkAuth([]);
    const parsed = ConnectionSchema.parse(data);

    const isEmployee = user.role === 'EMPLOYEE';
    const verificationStatus = isEmployee ? 'PENDING' : 'APPROVED';

    const isSingle = parsed.connectionType === 'SINGLE_BOTTLE';
    const cylDep = isSingle ? 2200.0 : 4400.0;
    const regDep = parsed.regulatorIncluded ? 250.0 : 0.0;
    const pipe = parsed.hosePipeIncluded ? 150.0 : 0.0;
    const book = parsed.lpgCardBookRequired ? 100.0 : 0.0;
    const install = 300.0;
    const stove = parsed.stoveIncluded ? 1500.0 : 0.0;
    
    const amountPending = parsed.totalAmount - parsed.amountPaid;
    const issuedCount = isSingle ? 1 : 2;

    const result = await prisma.$transaction(async (tx) => {
      // Find customer if relationshipId is linked to an existing consumer
      let customer = null;
      if (parsed.relationshipId && parsed.relationshipId.trim()) {
        customer = await tx.customer.findUnique({
          where: { consumerNumber: parsed.relationshipId }
        });
      }

      // Create Connection contract
      const connection = await tx.customerConnection.create({
        data: {
          customerId: customer?.id || null,
          customerName: parsed.customerName,
          consumerNumber: parsed.relationshipId || null,
          mobileNumber: parsed.mobile,
          address: parsed.address,
          connectionType: parsed.connectionType,
          stoveIncluded: parsed.stoveIncluded,
          cylinderSecurityDeposit: cylDep,
          regulatorDeposit: regDep,
          hosePipeCharge: pipe,
          stoveCharge: stove,
          installationCharge: install,
          totalAmount: parsed.totalAmount,
          amountPaid: parsed.amountPaid,
          amountPending,
          issuedCylindersCount: issuedCount,
          staffId: parsed.staffId,
          connectionDate: new Date(parsed.connectionDate),
          verificationStatus,
          remarks: `${parsed.remarks || ''} (Logged by ${user.name})`,
          relationshipId: parsed.relationshipId || null,
          upgradeType: parsed.upgradeType,
          regulatorIncluded: parsed.regulatorIncluded,
          hosePipeIncluded: parsed.hosePipeIncluded,
          lpgCardBookRequired: parsed.lpgCardBookRequired,
          eKycDone: parsed.eKycDone,
          eKycCharges: parsed.eKycCharges,
          lpgCardBookCharges: parsed.lpgCardBookCharges,
          paymentMode: parsed.paymentMode || null
        }
      });

      if (verificationStatus === 'APPROVED') {
        // Log Kyc / CardBook counters
        if (parsed.eKycDone && parsed.eKycCharges > 0) {
          await tx.kycCardBookTransaction.create({
            data: {
              type: 'EKYC',
              count: 1,
              chargesCollected: parsed.eKycCharges,
              txDate: new Date(parsed.connectionDate),
              remarks: `New connection eKYC: ${parsed.customerName}`
            }
          });
        }
        if (parsed.lpgCardBookRequired && parsed.lpgCardBookCharges > 0) {
          await tx.kycCardBookTransaction.create({
            data: {
              type: 'CARDBOOK',
              count: 1,
              chargesCollected: parsed.lpgCardBookCharges,
              txDate: new Date(parsed.connectionDate),
              remarks: `New connection LPG card book: ${parsed.customerName}`
            }
          });
        }
      }

      return { customer, connection };
    });

    await writeAudit(user.id, 'INSERT', 'customer_connections', result.connection.id, null, null, `Connection contract issued for ${parsed.customerName} (${verificationStatus}).`);

    revalidatePath('/');
    return { 
      success: true, 
      id: result.connection.id,
      message: isEmployee 
        ? `Connection contract for ${parsed.customerName} registered. Pending Admin verification.` 
        : `Connection contract for ${parsed.customerName} successfully registered.` 
    };
  } catch (error) {
    console.error('submitConnection error:', error.message);
    return { success: false, error: error.message };
  }
}


// ----------------------------------------------------
// 7. Create Invoice (ADMIN / MANAGER / ACCOUNTANT)
// ----------------------------------------------------
const InvoiceSchema = z.object({
  customerId: z.string().nullable().optional(),
  customerName: z.string().min(1, "Customer name is required"),
  consumerNumber: z.string().optional(),
  mobileNumber: z.string().optional(),
  address: z.string().optional(),
  cylinderType: z.string().min(1, "Cylinder description is required"),
  quantity: z.number().int().positive(),
  rate: z.number().positive(),
  paidAmount: z.number().nonnegative(),
  paymentStatus: z.enum(['paid', 'pending'])
});

export async function createInvoice(data) {
  try {
    const user = await checkAuth(['ADMIN', 'MANAGER', 'ACCOUNTANT']);
    const parsed = InvoiceSchema.parse(data);

    const totalAmount = parsed.quantity * parsed.rate;
    const balanceAmount = totalAmount - parsed.paidAmount;

    // Generate clean unique invoice number
    const invoiceNumber = `INV-${Date.now().toString().slice(-8)}`;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        customerId: parsed.customerId || null,
        customerName: parsed.customerName,
        consumerNumber: parsed.consumerNumber || null,
        mobileNumber: parsed.mobileNumber || null,
        address: parsed.address || null,
        cylinderType: parsed.cylinderType,
        quantity: parsed.quantity,
        rate: parsed.rate,
        totalAmount,
        paidAmount: parsed.paidAmount,
        balanceAmount,
        paymentStatus: parsed.paymentStatus
      }
    });

    await writeAudit(user.id, 'INSERT', 'invoices', invoice.id, null, { invoiceNumber }, `Invoice created.`);

    revalidatePath('/');
    return { success: true, message: `Invoice ${invoiceNumber} created.` };
  } catch (error) {
    console.error('createInvoice error:', error.message);
    return { success: false, error: error.message };
  }
}

// ----------------------------------------------------
// 7.5. Mark Invoice as Paid (ADMIN / MANAGER / ACCOUNTANT)
// ----------------------------------------------------
export async function markInvoicePaid(id) {
  try {
    const user = await checkAuth(['ADMIN', 'MANAGER', 'ACCOUNTANT']);
    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) {
      throw new Error("Invoice not found.");
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        paidAmount: invoice.totalAmount,
        balanceAmount: 0.0,
        paymentStatus: 'paid'
      }
    });

    await writeAudit(user.id, 'ADJUSTMENT', 'invoices', id, { status: invoice.paymentStatus }, { status: 'paid' }, `Invoice ${invoice.invoiceNumber} marked as fully paid.`);

    revalidatePath('/');
    return { success: true, message: `Invoice ${invoice.invoiceNumber} successfully marked as fully paid.` };
  } catch (error) {
    console.error('markInvoicePaid error:', error.message);
    return { success: false, error: error.message };
  }
}


// ----------------------------------------------------
// 8. Submit Daily Closing Counts (ADMIN / MANAGER only)
// ----------------------------------------------------
const ClosingSchema = z.object({
  closingDate: z.string().min(1, "Date is required"),
  physical14Filled: z.number().int().nonnegative(),
  physical14Empty: z.number().int().nonnegative(),
  physical19Filled: z.number().int().nonnegative(),
  physical19Empty: z.number().int().nonnegative(),
  physicalDamaged: z.number().int().nonnegative(),
  physicalLeakage: z.number().int().nonnegative(),
  cashInHand: z.number().nonnegative(),
  remarks: z.string().optional()
});

export async function submitDailyClosing(data) {
  try {
    const user = await checkAuth(['ADMIN', 'MANAGER', 'AUDITOR']);
    const parsed = ClosingSchema.parse(data);

    const result = await prisma.$transaction(async (tx) => {
      const inventory = await tx.inventory.findMany();
      const dom = inventory.find(i => i.cylinderType === 'DOMESTIC_14_2') || { filledStock: 0, emptyStock: 0 };
      const comm = inventory.find(i => i.cylinderType === 'COMMERCIAL_19') || { filledStock: 0, emptyStock: 0 };

      const expected14F = dom.filledStock;
      const expected14E = dom.emptyStock;
      const expected19F = comm.filledStock;
      const expected19E = comm.emptyStock;

      const m14F = parsed.physical14Filled - expected14F;
      const m14E = parsed.physical14Empty - expected14E;
      const m19F = parsed.physical19Filled - expected19F;
      const m19E = parsed.physical19Empty - expected19E;

      const dateVal = new Date(parsed.closingDate);
      const closing = await tx.dailyClosing.upsert({
        where: { closingDate: dateVal },
        update: {
          supervisorId: user.id,
          physical14Filled: parsed.physical14Filled,
          physical14Empty: parsed.physical14Empty,
          physical19Filled: parsed.physical19Filled,
          physical19Empty: parsed.physical19Empty,
          physicalDamaged: parsed.physicalDamaged,
          physicalLeakage: parsed.physicalLeakage,
          cashInHand: parsed.cashInHand,
          expected14Filled: expected14F,
          expected14Empty: expected14E,
          expected19Filled: expected19F,
          expected19Empty: expected19E,
          mismatch14Filled: m14F,
          mismatch14Empty: m14E,
          mismatch19Filled: m19F,
          mismatch19Empty: m19E,
          isLocked: true,
          remarks: parsed.remarks
        },
        create: {
          closingDate: dateVal,
          supervisorId: user.id,
          physical14Filled: parsed.physical14Filled,
          physical14Empty: parsed.physical14Empty,
          physical19Filled: parsed.physical19Filled,
          physical19Empty: parsed.physical19Empty,
          physicalDamaged: parsed.physicalDamaged,
          physicalLeakage: parsed.physicalLeakage,
          expected14Filled: expected14F,
          expected14Empty: expected14E,
          expected19Filled: expected19F,
          expected19Empty: expected19E,
          mismatch14Filled: m14F,
          mismatch14Empty: m14E,
          mismatch19Filled: m19F,
          mismatch19Empty: m19E,
          cashInHand: parsed.cashInHand,
          isLocked: true,
          remarks: parsed.remarks
        }
      });

      await tx.inventory.update({
        where: { cylinderType: 'DOMESTIC_14_2' },
        data: {
          filledStock: parsed.physical14Filled,
          emptyStock: parsed.physical14Empty,
          damagedStock: parsed.physicalDamaged,
          leakageStock: parsed.physicalLeakage
        }
      });

      await tx.inventory.update({
        where: { cylinderType: 'COMMERCIAL_19' },
        data: {
          filledStock: parsed.physical19Filled,
          emptyStock: parsed.physical19Empty
        }
      });



      return {
        closing,
        mismatches: {
          mismatch14F: m14F,
          mismatch14E: m14E,
          mismatch19F: m19F,
          mismatch19E: m19E
        },
        expected: {
          expected14F, expected14E, expected19F, expected19E
        }
      };
    });

    // Closing reports notifications logged to system console
    console.log(`EOD Stock closing locked for ${parsed.closingDate}. Domestic Filled Mismatch: ${result.mismatches.mismatch14F}`);

    await writeAudit(user.id, 'DAILY_CLOSING', 'daily_closing', result.closing.id, null, null, `Daily closing locked.`);

    revalidatePath('/');
    return { 
      success: true, 
      mismatches: result.mismatches, 
      message: 'Daily closing counts synced and EOD report mailed.' 
    };
  } catch (error) {
    console.error('submitDailyClosing action error:', error.message);
    return { success: false, error: error.message };
  }
}

// ----------------------------------------------------
// 9. Send Commercial Reminder (ADMIN / MANAGER / ACCOUNTANT)
// ----------------------------------------------------
export async function sendCommercialReminder(id, type) {
  try {
    const user = await checkAuth(['ADMIN', 'MANAGER', 'ACCOUNTANT']);
    const ledger = await prisma.commercialLedger.findUnique({
      where: { id },
      include: { customer: true }
    });

    if (!ledger || !ledger.customer.mobile) {
      throw new Error("Ledger or customer contact details missing.");
    }

    // Mock customer email mappings for demonstration
    const customerEmail = ledger.customer.mobile ? `${ledger.customer.name.replace(/\s+/g, '').toLowerCase()}@mockemail.com` : 'client@example.com';

    if (type === 'payment') {
      console.log(`Mock commercial payment reminder sent to ${ledger.customer.name} (Amount pending: ₹${ledger.amountPending})`);
    } else {
      console.log(`Mock commercial empty return reminder sent to ${ledger.customer.name} (Empty pending: ${ledger.emptyPending})`);
    }

    return { success: true, message: `Reminder successfully sent to ${ledger.customer.name} (Mocked).` };
  } catch (error) {
    console.error('sendCommercialReminder error:', error.message);
    return { success: false, error: error.message };
  }
}

// ----------------------------------------------------
// 10. Log Cylinder Incident (All logged-in roles)
// ----------------------------------------------------
const IncidentSchema = z.object({
  incidentDate: z.string().min(1, "Date is required"),
  incidentCategory: z.enum(['Cylinder', 'Regulator', 'Hose Pipe', 'Delivery', 'Customer Complaint', 'Other']),
  cylinderType: z.enum(['DOMESTIC_14_2', 'COMMERCIAL_19', 'NA']),
  issueType: z.string().min(1, "Issue description is required"),
  quantity: z.number().int().nonnegative().default(0),
  regulatorSerialNumber: z.string().optional(),
  reportedBy: z.string().optional(),
  customerId: z.string().nullable().optional(),
  customerName: z.string().optional(),
  consumerNumber: z.string().optional(),
  mobileNumber: z.string().optional(),
  address: z.string().optional(),
  detectedBy: z.string().min(1, "Staff link is required"),
  location: z.string().min(1, "Location is required"),
  remarks: z.string().optional(),
  photoUrl: z.string().optional(),
  hosePipeReturned: z.boolean().default(false),
  hosePipeQuantity: z.number().int().nonnegative().default(0)
});

export async function submitIncident(data) {
  try {
    const user = await checkAuth([]);
    const parsed = IncidentSchema.parse(data);

    const isEmployee = user.role === 'EMPLOYEE';
    const verificationStatus = isEmployee ? 'PENDING' : 'APPROVED';

    const cylinderEnum = parsed.cylinderType === 'NA' ? null : parsed.cylinderType;

    const result = await prisma.$transaction(async (tx) => {
      const incident = await tx.cylinderIncident.create({
        data: {
          incidentDate: new Date(parsed.incidentDate),
          cylinderType: cylinderEnum,
          quantity: parsed.quantity,
          location: parsed.location,
          detectedById: parsed.detectedBy,
          status: 'open',
          verificationStatus,
          remarks: `${parsed.remarks || ''} (Logged by ${user.name})`,
          incidentCategory: parsed.incidentCategory,
          issueType: parsed.issueType,
          regulatorSerialNumber: parsed.regulatorSerialNumber || null,
          hosePipeReturned: parsed.hosePipeReturned,
          hosePipeQuantity: parsed.hosePipeQuantity,
          reportedBy: parsed.reportedBy || user.name,
          customerId: parsed.customerId || null,
          customerName: parsed.customerName || null,
          consumerNumber: parsed.consumerNumber || null,
          mobileNumber: parsed.mobileNumber || null,
          address: parsed.address || null,
          photoUrl: parsed.photoUrl || null
        }
      });

      if (verificationStatus === 'APPROVED') {
        // If Cylinder type category, update inventory
        if (parsed.incidentCategory === 'Cylinder' && cylinderEnum) {
          if (parsed.issueType.toLowerCase().includes('leak')) {
            await tx.inventory.update({
              where: { cylinderType: cylinderEnum },
              data: {
                filledStock: { decrement: parsed.quantity },
                leakageStock: { increment: parsed.quantity }
              }
            });
          } else {
            await tx.inventory.update({
              where: { cylinderType: cylinderEnum },
              data: {
                emptyStock: { decrement: parsed.quantity },
                damagedStock: { increment: parsed.quantity }
              }
            });
          }
        }

        // If Regulator
        if (parsed.incidentCategory === 'Regulator' && parsed.regulatorSerialNumber) {
          await tx.regulatorReturn.create({
            data: {
              serialNumber: parsed.regulatorSerialNumber,
              returnDate: new Date(parsed.incidentDate),
              customerId: parsed.customerId || null,
              customerName: parsed.customerName || null,
              consumerNumber: parsed.consumerNumber || null,
              mobileNumber: parsed.mobileNumber || null,
              address: parsed.address || null,
              staffId: parsed.detectedBy,
              remarks: `Incident report regulator defect: ${parsed.issueType}`
            }
          });
        }

        // If Hose Pipe
        if (parsed.incidentCategory === 'Hose Pipe' && parsed.hosePipeReturned && parsed.hosePipeQuantity > 0) {
          await tx.hosePipeTransaction.create({
            data: {
              type: 'RETURN',
              quantity: parsed.hosePipeQuantity,
              txDate: new Date(parsed.incidentDate),
              customerId: parsed.customerId || null,
              customerName: parsed.customerName || null,
              consumerNumber: parsed.consumerNumber || null,
              mobileNumber: parsed.mobileNumber || null,
              address: parsed.address || null,
              staffId: parsed.detectedBy,
              remarks: `Incident report hose pipe return: ${parsed.issueType}`
            }
          });
        }
      }

      return incident;
    });

    await writeAudit(user.id, 'INSERT', 'cylinder_incidents', result.id, null, null, `Incident defect isolated (${verificationStatus}).`);

    revalidatePath('/');
    return { 
      success: true, 
      id: result.id,
      message: isEmployee 
        ? 'Incident report successfully submitted. Pending Admin verification.' 
        : 'Incident report successfully recorded.' 
    };
  } catch (error) {
    console.error('submitIncident action error:', error.message);
    return { success: false, error: error.message };
  }
}

// ----------------------------------------------------
// 11. Log Expense (ADMIN, MANAGER or ACCOUNTANT only)
// ----------------------------------------------------
const ExpenseSchema = z.object({
  expenseDate: z.string().min(1, "Date is required"),
  category: z.string().min(1, "Category is required"),
  amount: z.number().positive(),
  paidTo: z.string().min(1, "Vendor name is required"),
  paymentMode: z.enum(['CASH', 'UPI', 'BANK_TRANSFER']),
  remarks: z.string().optional()
});

export async function submitExpense(data) {
  try {
    const user = await checkAuth(['ADMIN', 'MANAGER', 'ACCOUNTANT']);
    const parsed = ExpenseSchema.parse(data);

    const expense = await prisma.expense.create({
      data: {
        expenseDate: new Date(parsed.expenseDate),
        category: parsed.category,
        amount: parsed.amount,
        paidTo: parsed.paidTo,
        paymentMode: parsed.paymentMode,
        remarks: parsed.remarks
      }
    });

    await writeAudit(user.id, 'INSERT', 'expenses', expense.id, null, null, `Expense logged.`);

    revalidatePath('/');
    return { success: true, message: 'Expense record successfully submitted.' };
  } catch (error) {
    console.error('submitExpense error:', error.message);
    return { success: false, error: error.message };
  }
}

// ----------------------------------------------------
// 12. Send Invoice Payment Reminder (ADMIN / MANAGER / ACCOUNTANT)
// ----------------------------------------------------
export async function sendInvoiceReminder(id) {
  try {
    const user = await checkAuth(['ADMIN', 'MANAGER', 'ACCOUNTANT']);
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { customer: true }
    });
    if (!invoice) {
      throw new Error("Invoice not found.");
    }
    
    // Fallback email construct
    const customerEmail = invoice.customer.mobile 
      ? `${invoice.customer.name.replace(/\s+/g, '').toLowerCase()}@mockemail.com` 
      : 'client@example.com';
    
    console.log(`Mock invoice payment reminder sent to ${invoice.customer.name} (Invoice: ${invoice.invoiceNumber}, Balance: ₹${invoice.balanceAmount})`);
    return { success: true, message: `Reminder successfully sent to ${invoice.customer.name} (Mocked).` };
  } catch (error) {
    console.error('sendInvoiceReminder error:', error.message);
    return { success: false, error: error.message };
  }
}

// ----------------------------------------------------
// 13. Empty returns (All roles)
// ----------------------------------------------------
const EmptyReturnSchema = z.object({
  customerId: z.string().nullable().optional(),
  customerName: z.string().min(1, "Customer name is required"),
  consumerNumber: z.string().optional(),
  mobileNumber: z.string().optional(),
  address: z.string().optional(),
  quantity: z.number().int().positive(),
  cylinderType: z.enum(['DOMESTIC_14_2', 'COMMERCIAL_19']),
  returnDate: z.string().min(1, "Return date is required"),
  remarks: z.string().optional()
});

export async function submitEmptyReturn(data) {
  try {
    const user = await checkAuth([]);
    const parsed = EmptyReturnSchema.parse(data);

    const isEmployee = user.role === 'EMPLOYEE';
    const verificationStatus = isEmployee ? 'PENDING' : 'APPROVED';

    const activeLoadCycle = await prisma.loadCycle.findFirst({
      where: { status: 'active' }
    });

    const result = await prisma.$transaction(async (tx) => {
      const entry = await tx.emptyReturn.create({
        data: {
          customerId: parsed.customerId || null,
          customerName: parsed.customerName,
          consumerNumber: parsed.consumerNumber || null,
          mobileNumber: parsed.mobileNumber || null,
          address: parsed.address || null,
          quantity: parsed.quantity,
          cylinderType: parsed.cylinderType,
          returnDate: new Date(parsed.returnDate),
          verificationStatus,
          remarks: `${parsed.remarks || ''} (Logged by ${user.name})`,
          loadCycleId: activeLoadCycle?.id || null
        }
      });

      if (verificationStatus === 'APPROVED') {
        await tx.inventory.update({
          where: { cylinderType: parsed.cylinderType },
          data: {
            emptyStock: { increment: parsed.quantity }
          }
        });

        await tx.inventoryTransaction.create({
          data: {
            transactionDate: new Date(parsed.returnDate),
            eventType: 'EMPTY_RETURN',
            referenceId: entry.id,
            cylinderType: parsed.cylinderType,
            emptyChange: parsed.quantity,
            remarks: `Empty cylinder return`
          }
        });

        if (parsed.cylinderType === 'COMMERCIAL_19' && parsed.customerId) {
          const ledgers = await tx.commercialLedger.findMany({
            where: {
              customerId: parsed.customerId,
              cylinderType: 'COMMERCIAL_19',
              emptyPending: { gt: 0 }
            },
            orderBy: { createdAt: 'asc' }
          });

          let returnQty = parsed.quantity;
          for (const ledger of ledgers) {
            if (returnQty <= 0) break;
            const toClear = Math.min(returnQty, ledger.emptyPending);
            const newEmptyReturned = ledger.emptyReturned + toClear;
            const newEmptyPending = ledger.emptyPending - toClear;
            
            const newStatus = (ledger.amountPending === 0 && newEmptyPending === 0) ? 'clear' : ledger.status;

            await tx.commercialLedger.update({
              where: { id: ledger.id },
              data: {
                emptyReturned: newEmptyReturned,
                emptyPending: newEmptyPending,
                status: newStatus
              }
            });
            returnQty -= toClear;
          }
        }

        if (activeLoadCycle) {
          await tx.loadCycle.update({
            where: { id: activeLoadCycle.id },
            data: {
              emptyReturns: { increment: parsed.quantity }
            }
          });
        }
      }

      return entry;
    });

    await writeAudit(user.id, 'INSERT', 'empty_returns', result.id, null, null, `Empty return logged (${verificationStatus}).`);

    revalidatePath('/');
    return { 
      success: true, 
      message: isEmployee 
        ? 'Empty cylinder return logged. Pending Admin verification.' 
        : 'Empty cylinder return successfully logged.' 
    };
  } catch (error) {
    console.error('submitEmptyReturn error:', error.message);
    return { success: false, error: error.message };
  }
}

// ----------------------------------------------------
// 14. Customer Payments (All roles)
// ----------------------------------------------------
const PaymentSchema = z.object({
  customerId: z.string().nullable().optional(),
  customerName: z.string().min(1, "Customer name is required"),
  consumerNumber: z.string().optional(),
  mobileNumber: z.string().optional(),
  address: z.string().optional(),
  amount: z.number().positive(),
  paymentDate: z.string().min(1, "Payment date is required"),
  paymentMode: z.enum(['CASH', 'UPI', 'BANK_TRANSFER']),
  remarks: z.string().optional()
});

export async function submitPayment(data) {
  try {
    const user = await checkAuth([]);
    const parsed = PaymentSchema.parse(data);

    const isEmployee = user.role === 'EMPLOYEE';
    const verificationStatus = isEmployee ? 'PENDING' : 'APPROVED';

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          customerId: parsed.customerId || null,
          customerName: parsed.customerName,
          consumerNumber: parsed.consumerNumber || null,
          mobileNumber: parsed.mobileNumber || null,
          address: parsed.address || null,
          amount: parsed.amount,
          paymentDate: new Date(parsed.paymentDate),
          paymentMode: parsed.paymentMode,
          verificationStatus,
          remarks: `${parsed.remarks || ''} (Logged by ${user.name})`
        }
      });

      if (verificationStatus === 'APPROVED' && parsed.customerId) {
        const ledgers = await tx.commercialLedger.findMany({
          where: {
            customerId: parsed.customerId,
            amountPending: { gt: 0 }
          },
          orderBy: { createdAt: 'asc' }
        });

        let payAmount = parsed.amount;
        for (const ledger of ledgers) {
          if (payAmount <= 0) break;
          const toClear = Math.min(payAmount, ledger.amountPending);
          const newAmountReceived = ledger.amountReceived + toClear;
          const newAmountPending = ledger.amountPending - toClear;

          const newStatus = (newAmountPending === 0 && ledger.emptyPending === 0) ? 'clear' : (newAmountPending === 0 ? 'amount_clear' : 'partially_clear');

          await tx.commercialLedger.update({
            where: { id: ledger.id },
            data: {
              amountReceived: newAmountReceived,
              amountPending: newAmountPending,
              status: newStatus
            }
          });
          payAmount -= toClear;
        }
      }

      return payment;
    });

    await writeAudit(user.id, 'INSERT', 'payments', result.id, null, null, `Payment logged (${verificationStatus}).`);

    revalidatePath('/');
    return {
      success: true,
      message: isEmployee
        ? 'Payment logged. Pending Admin verification.'
        : 'Payment logged successfully.'
    };
  } catch (error) {
    console.error('submitPayment error:', error.message);
    return { success: false, error: error.message };
  }
}

// ----------------------------------------------------
// 15. Stock Adjustment (ADMIN only)
// ----------------------------------------------------
const StockAdjustmentSchema = z.object({
  cylinderType: z.enum(['DOMESTIC_14_2', 'COMMERCIAL_19']),
  filledChange: z.number().int(),
  emptyChange: z.number().int(),
  damagedChange: z.number().int(),
  leakageChange: z.number().int(),
  remarks: z.string().min(1, "Adjustment reason is required")
});

export async function createStockAdjustment(data) {
  try {
    const user = await checkAuth(['ADMIN']);
    const parsed = StockAdjustmentSchema.parse(data);

    const result = await prisma.$transaction(async (tx) => {
      const inv = await tx.inventory.update({
        where: { cylinderType: parsed.cylinderType },
        data: {
          filledStock: { increment: parsed.filledChange },
          emptyStock: { increment: parsed.emptyChange },
          damagedStock: { increment: parsed.damagedChange },
          leakageStock: { increment: parsed.leakageChange }
        }
      });

      await tx.inventoryTransaction.create({
        data: {
          transactionDate: new Date(),
          eventType: 'ADJUSTMENT',
          cylinderType: parsed.cylinderType,
          filledChange: parsed.filledChange,
          emptyChange: parsed.emptyChange,
          damagedChange: parsed.damagedChange,
          leakageChange: parsed.leakageChange,
          remarks: parsed.remarks
        }
      });

      return inv;
    });

    await writeAudit(user.id, 'ADJUSTMENT', 'inventory', result.id, null, parsed, `Stock adjusted: ${parsed.remarks}`);

    revalidatePath('/');
    return { success: true, message: `Stock adjusted successfully for ${parsed.cylinderType}.` };
  } catch (error) {
    console.error('createStockAdjustment error:', error.message);
    return { success: false, error: error.message };
  }
}

// ----------------------------------------------------
// 16. Approve Verification Queue Entry (ADMIN / MANAGER only)
// ----------------------------------------------------
export async function approveVerificationEntry(id, type, correctedData = null) {
  try {
    const user = await checkAuth(['ADMIN', 'MANAGER']);

    const result = await prisma.$transaction(async (tx) => {
      if (type === 'DELIVERY') {
        const delivery = await tx.delivery.findUnique({
          where: { id },
          include: { deliveryItems: true }
        });
        if (!delivery || delivery.verificationStatus !== 'PENDING') {
          throw new Error("Pending delivery not found.");
        }

        let quantityDelivered = delivery.deliveryItems[0]?.quantityDelivered || 0;
        let emptyReturned = delivery.deliveryItems[0]?.emptyReturned || 0;
        let ratePerCylinder = delivery.deliveryItems[0]?.ratePerCylinder || 0;
        let amountReceived = delivery.amountReceived;
        let cylinderType = delivery.deliveryItems[0]?.cylinderType || 'DOMESTIC_14_2';

        const oldQtyDelivered = quantityDelivered;
        const oldEmptyReturned = emptyReturned;

        if (correctedData) {
          if (correctedData.quantityDelivered !== undefined) quantityDelivered = parseInt(correctedData.quantityDelivered);
          if (correctedData.emptyReturned !== undefined) emptyReturned = parseInt(correctedData.emptyReturned);
          if (correctedData.ratePerCylinder !== undefined) ratePerCylinder = parseFloat(correctedData.ratePerCylinder);
          if (correctedData.amountReceived !== undefined) amountReceived = parseFloat(correctedData.amountReceived);
        }

        const totalAmount = quantityDelivered * ratePerCylinder;
        const paymentStatus = amountReceived >= totalAmount ? 'paid' : (amountReceived > 0 ? 'partial' : 'pending_credit');

        if (delivery.deliveryItems[0]) {
          await tx.deliveryItem.update({
            where: { id: delivery.deliveryItems[0].id },
            data: {
              quantityDelivered,
              emptyReturned,
              ratePerCylinder,
              lineTotal: totalAmount
            }
          });
        }

        const approvedDelivery = await tx.delivery.update({
          where: { id },
          data: {
            verificationStatus: 'APPROVED',
            totalAmount,
            amountReceived,
            amountPending: totalAmount - amountReceived,
            paymentStatus,
            remarks: delivery.remarks + (correctedData ? " (Modified & Approved by Admin)" : " (Approved by Admin)")
          }
        });

        // Calculate delta stock adjustments if there was corrected data
        const deltaFilled = quantityDelivered - oldQtyDelivered;
        const deltaEmpty = emptyReturned - oldEmptyReturned;

        if (deltaFilled !== 0 || deltaEmpty !== 0) {
          if (deltaFilled > 0) {
            const currentStock = await tx.inventory.findUnique({
              where: { cylinderType }
            });
            if (!currentStock || currentStock.filledStock < deltaFilled) {
              throw new Error(`Insufficient stock for modified delivery amount. Current stock: ${currentStock?.filledStock || 0}`);
            }
          }

          await tx.inventory.update({
            where: { cylinderType },
            data: {
              filledStock: { decrement: deltaFilled },
              emptyStock: { increment: deltaEmpty }
            }
          });

          await tx.inventoryTransaction.create({
            data: {
              transactionDate: new Date(),
              eventType: 'ADJUSTMENT',
              referenceId: delivery.id,
              cylinderType,
              filledChange: -deltaFilled,
              emptyChange: deltaEmpty,
              remarks: `Admin correction of delivery quantity during verification`
            }
          });
        }

        // Adjust or create Commercial Ledger
        if (cylinderType === 'COMMERCIAL_19' || totalAmount - amountReceived > 0) {
          const ledgerStatus = amountReceived >= totalAmount ? 'clear' : (amountReceived > 0 ? 'partially_clear' : 'pending');
          
          await tx.commercialLedger.deleteMany({
            where: { deliveryId: delivery.id }
          });

          await tx.commercialLedger.create({
            data: {
              customerId: delivery.customerId || null,
              customerName: delivery.customerName,
              consumerNumber: delivery.consumerNumber || null,
              mobileNumber: delivery.mobileNumber || null,
              address: delivery.address || null,
              deliveryId: delivery.id,
              cylinderType,
              quantityDelivered,
              emptyReturned,
              emptyPending: quantityDelivered - emptyReturned,
              amountBilled: totalAmount,
              amountReceived,
              amountPending: totalAmount - amountReceived,
              dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              status: ledgerStatus
            }
          });
        }

        return approvedDelivery;
      }

      else if (type === 'CONNECTION') {
        const connection = await tx.customerConnection.findUnique({ where: { id } });
        if (!connection || connection.verificationStatus !== 'PENDING') {
          throw new Error("Pending connection not found.");
        }

        let amountPaid = connection.amountPaid;
        if (correctedData && correctedData.amountPaid !== undefined) {
          amountPaid = parseFloat(correctedData.amountPaid);
        }
        const amountPending = connection.totalAmount - amountPaid;

        const approvedConnection = await tx.customerConnection.update({
          where: { id },
          data: {
            verificationStatus: 'APPROVED',
            amountPaid,
            amountPending,
            remarks: connection.remarks + (correctedData ? " (Modified & Approved by Admin)" : " (Approved by Admin)")
          }
        });

        // Connection registration does not reduce cylinder stock immediately.
        // Actual stock reduction happens only when a cylinder is physically issued (refill entry).

        // Log Kyc / CardBook counters
        if (connection.eKycDone && connection.eKycCharges > 0) {
          await tx.kycCardBookTransaction.create({
            data: {
              type: 'EKYC',
              count: 1,
              chargesCollected: connection.eKycCharges,
              txDate: connection.connectionDate,
              remarks: `Approved connection eKYC: ${connection.id}`
            }
          });
        }
        if (connection.lpgCardBookRequired && connection.lpgCardBookCharges > 0) {
          await tx.kycCardBookTransaction.create({
            data: {
              type: 'CARDBOOK',
              count: 1,
              chargesCollected: connection.lpgCardBookCharges,
              txDate: connection.connectionDate,
              remarks: `Approved connection LPG card book: ${connection.id}`
            }
          });
        }
        if (connection.hosePipeIncluded) {
          await tx.hosePipeTransaction.create({
            data: {
              type: 'SALE',
              quantity: 1,
              txDate: connection.connectionDate,
              customerId: connection.customerId,
              staffId: connection.staffId,
              remarks: `Approved connection hose pipe sold`
            }
          });
        }

        return approvedConnection;
      }

      else if (type === 'EMPTY_RETURN') {
        const emptyReturn = await tx.emptyReturn.findUnique({ where: { id } });
        if (!emptyReturn || emptyReturn.verificationStatus !== 'PENDING') {
          throw new Error("Pending empty return not found.");
        }

        let quantity = emptyReturn.quantity;
        if (correctedData && correctedData.quantity !== undefined) {
          quantity = parseInt(correctedData.quantity);
        }

        const approvedReturn = await tx.emptyReturn.update({
          where: { id },
          data: {
            verificationStatus: 'APPROVED',
            quantity,
            remarks: emptyReturn.remarks + (correctedData ? " (Modified & Approved by Admin)" : " (Approved by Admin)")
          }
        });

        await tx.inventory.update({
          where: { cylinderType: emptyReturn.cylinderType },
          data: {
            emptyStock: { increment: quantity }
          }
        });

        await tx.inventoryTransaction.create({
          data: {
            transactionDate: new Date(),
            eventType: 'EMPTY_RETURN',
            referenceId: emptyReturn.id,
            cylinderType: emptyReturn.cylinderType,
            emptyChange: quantity,
            remarks: `Approved empty cylinder return`
          }
        });

        if (emptyReturn.cylinderType === 'COMMERCIAL_19') {
          const ledgers = await tx.commercialLedger.findMany({
            where: {
              customerId: emptyReturn.customerId,
              cylinderType: 'COMMERCIAL_19',
              emptyPending: { gt: 0 }
            },
            orderBy: { createdAt: 'asc' }
          });

          let returnQty = quantity;
          for (const ledger of ledgers) {
            if (returnQty <= 0) break;
            const toClear = Math.min(returnQty, ledger.emptyPending);
            const newEmptyReturned = ledger.emptyReturned + toClear;
            const newEmptyPending = ledger.emptyPending - toClear;
            
            const newStatus = (ledger.amountPending === 0 && newEmptyPending === 0) ? 'clear' : ledger.status;

            await tx.commercialLedger.update({
              where: { id: ledger.id },
              data: {
                emptyReturned: newEmptyReturned,
                emptyPending: newEmptyPending,
                status: newStatus
              }
            });
            returnQty -= toClear;
          }
        }

        return approvedReturn;
      }

      else if (type === 'PAYMENT') {
        const payment = await tx.payment.findUnique({ where: { id } });
        if (!payment || payment.verificationStatus !== 'PENDING') {
          throw new Error("Pending payment not found.");
        }

        let amount = payment.amount;
        if (correctedData && correctedData.amount !== undefined) {
          amount = parseFloat(correctedData.amount);
        }

        const approvedPayment = await tx.payment.update({
          where: { id },
          data: {
            verificationStatus: 'APPROVED',
            amount,
            remarks: payment.remarks + (correctedData ? " (Modified & Approved by Admin)" : " (Approved by Admin)")
          }
        });

        const ledgers = await tx.commercialLedger.findMany({
          where: {
            customerId: payment.customerId,
            amountPending: { gt: 0 }
          },
          orderBy: { createdAt: 'asc' }
        });

        let payAmount = amount;
        for (const ledger of ledgers) {
          if (payAmount <= 0) break;
          const toClear = Math.min(payAmount, ledger.amountPending);
          const newAmountReceived = ledger.amountReceived + toClear;
          const newAmountPending = ledger.amountPending - toClear;

          const newStatus = (newAmountPending === 0 && ledger.emptyPending === 0) ? 'clear' : (newAmountPending === 0 ? 'amount_clear' : 'partially_clear');

          await tx.commercialLedger.update({
            where: { id: ledger.id },
            data: {
              amountReceived: newAmountReceived,
              amountPending: newAmountPending,
              status: newStatus
            }
          });
          payAmount -= toClear;
        }

        return approvedPayment;
      }

      else if (type === 'INCIDENT') {
        const incident = await tx.cylinderIncident.findUnique({ where: { id } });
        if (!incident || incident.verificationStatus !== 'PENDING') {
          throw new Error("Pending incident not found.");
        }

        let quantity = incident.quantity;
        if (correctedData && correctedData.quantity !== undefined) {
          quantity = parseInt(correctedData.quantity);
        }

        const approvedIncident = await tx.cylinderIncident.update({
          where: { id },
          data: {
            verificationStatus: 'APPROVED',
            quantity,
            remarks: incident.remarks + (correctedData ? " (Modified & Approved by Admin)" : " (Approved by Admin)")
          }
        });

        // Cylinder defect
        if (incident.incidentCategory === 'Cylinder' && incident.cylinderType) {
          const isLeak = incident.issueType && incident.issueType.toLowerCase().includes('leak');
          if (isLeak) {
            await tx.inventory.update({
              where: { cylinderType: incident.cylinderType },
              data: {
                filledStock: { decrement: quantity },
                leakageStock: { increment: quantity }
              }
            });
          } else {
            await tx.inventory.update({
              where: { cylinderType: incident.cylinderType },
              data: {
                emptyStock: { decrement: quantity },
                damagedStock: { increment: quantity }
              }
            });
          }

          await tx.inventoryTransaction.create({
            data: {
              transactionDate: new Date(),
              eventType: 'INCIDENT',
              referenceId: incident.id,
              cylinderType: incident.cylinderType,
              filledChange: isLeak ? -quantity : 0,
              emptyChange: !isLeak ? -quantity : 0,
              damagedChange: !isLeak ? quantity : 0,
              leakageChange: isLeak ? quantity : 0,
              remarks: `Approved cylinder defect incident`
            }
          });
        }

        // Regulator return
        if (incident.incidentCategory === 'Regulator' && incident.regulatorSerialNumber) {
          await tx.regulatorReturn.create({
            data: {
              serialNumber: incident.regulatorSerialNumber,
              returnDate: incident.incidentDate,
              customerId: incident.customerId,
              staffId: incident.detectedById,
              remarks: `Approved incident report regulator defect: ${incident.issueType || ''}`
            }
          });
        }

        // Hose pipe return
        if (incident.incidentCategory === 'Hose Pipe' && incident.hosePipeReturned && incident.hosePipeQuantity > 0) {
          await tx.hosePipeTransaction.create({
            data: {
              type: 'RETURN',
              quantity: incident.hosePipeQuantity,
              txDate: incident.incidentDate,
              customerId: incident.customerId,
              staffId: incident.detectedById,
              remarks: `Approved incident report hose pipe return: ${incident.issueType || ''}`
            }
          });
        }

        return approvedIncident;
      }

      throw new Error("Invalid verification entry type.");
    });

    const audTable = type === 'DELIVERY' ? 'deliveries' : type === 'CONNECTION' ? 'customer_connections' : type === 'EMPTY_RETURN' ? 'empty_returns' : type === 'PAYMENT' ? 'payments' : 'cylinder_incidents';
    await writeAudit(user.id, 'ADJUSTMENT', audTable, id, null, null, `${type} verified & approved.`);

    revalidatePath('/');
    return { success: true, message: `${type} verification successfully approved.` };
  } catch (error) {
    console.error('approveVerificationEntry error:', error.message);
    return { success: false, error: error.message };
  }
}

// ----------------------------------------------------
// 17. Reject Verification Queue Entry (ADMIN / MANAGER only)
// ----------------------------------------------------
export async function rejectVerificationEntry(id, type, reason) {
  try {
    const user = await checkAuth(['ADMIN', 'MANAGER']);

    const result = await prisma.$transaction(async (tx) => {
      const remarksSuffix = ` (Rejected by Admin: ${reason})`;
      const tableName = type === 'DELIVERY' ? 'delivery' : type === 'CONNECTION' ? 'customerConnection' : type === 'EMPTY_RETURN' ? 'emptyReturn' : type === 'PAYMENT' ? 'payment' : 'cylinderIncident';
      
      const existing = await tx[tableName].findUnique({ where: { id } });
      if (!existing) {
        throw new Error(`Pending entry ${id} not found.`);
      }

      if (type === 'DELIVERY' && existing.verificationStatus !== 'REJECTED') {
        // If it's a delivery refill, we must reverse the stock decrement and empty increment
        const deliveryWithItems = await tx.delivery.findUnique({
          where: { id },
          include: { deliveryItems: true }
        });
        const item = deliveryWithItems?.deliveryItems?.[0];
        if (item) {
          await tx.inventory.update({
            where: { cylinderType: item.cylinderType },
            data: {
              filledStock: { increment: item.quantityDelivered },
              emptyStock: { decrement: item.emptyReturned }
            }
          });

          await tx.inventoryTransaction.create({
            data: {
              transactionDate: new Date(),
              eventType: 'REVERSAL',
              referenceId: id,
              cylinderType: item.cylinderType,
              filledChange: item.quantityDelivered,
              emptyChange: -item.emptyReturned,
              remarks: `Stock reversal for rejected refill entry: ${reason}`
            }
          });
        }
      }

      const updatedRemarks = (existing.remarks || '') + remarksSuffix;
      
      return await tx[tableName].update({
        where: { id },
        data: {
          verificationStatus: 'REJECTED',
          remarks: updatedRemarks
        }
      });
    });

    const audTable = type === 'DELIVERY' ? 'deliveries' : type === 'CONNECTION' ? 'customer_connections' : type === 'EMPTY_RETURN' ? 'empty_returns' : type === 'PAYMENT' ? 'payments' : 'cylinder_incidents';
    await writeAudit(user.id, 'ADJUSTMENT', audTable, id, null, null, `${type} rejected. Reason: ${reason}`);

    revalidatePath('/');
    return { success: true, message: `${type} entry successfully rejected.` };
  } catch (error) {
    console.error('rejectVerificationEntry error:', error.message);
    return { success: false, error: error.message };
  }
}

// ----------------------------------------------------
// 18. Commercial Customer creation (ADMIN / MANAGER only)
// ----------------------------------------------------
const CommercialCustomerSchema = z.object({
  name: z.string().min(1, "Company / Business Name is required"),
  contactPerson: z.string().optional(),
  mobile: z.string().optional(),
  address: z.string().optional(),
  gstin: z.string().optional(),
  category: z.string().optional(),
  creditAllowed: z.boolean().default(true),
  openingOutstanding: z.number().nonnegative().default(0)
});

export async function createCommercialCustomer(data) {
  try {
    const user = await checkAuth(['ADMIN', 'MANAGER']);
    const parsed = CommercialCustomerSchema.parse(data);

    const customer = await prisma.$transaction(async (tx) => {
      const cust = await tx.customer.create({
        data: {
          name: parsed.name,
          consumerNumber: `COM-${Date.now().toString().slice(-6)}`,
          mobile: parsed.mobile || null,
          address: parsed.address || null,
          customerType: 'commercial',
          creditAllowed: parsed.creditAllowed,
          contactPerson: parsed.contactPerson || null,
          gstin: parsed.gstin || null,
          category: parsed.category || null,
          openingOutstanding: parsed.openingOutstanding
        }
      });

      if (parsed.openingOutstanding > 0) {
        await tx.commercialLedger.create({
          data: {
            customerId: cust.id,
            cylinderType: 'COMMERCIAL_19',
            quantityDelivered: 0,
            emptyReturned: 0,
            emptyPending: 0,
            amountBilled: parsed.openingOutstanding,
            amountReceived: 0,
            amountPending: parsed.openingOutstanding,
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            status: 'pending'
          }
        });
      }

      return cust;
    });

    await writeAudit(user.id, 'INSERT', 'customers', customer.id, null, null, `Commercial customer created: ${parsed.name}`);
    revalidatePath('/');
    return { success: true, customer, message: `Commercial customer ${parsed.name} created successfully.` };
  } catch (error) {
    console.error('createCommercialCustomer error:', error.message);
    return { success: false, error: error.message };
  }
}

// ----------------------------------------------------
// 19. Submit Regulator Return (All roles)
// ----------------------------------------------------
const RegulatorReturnSchema = z.object({
  serialNumber: z.string().min(1, "Serial Number is required"),
  returnDate: z.string().min(1, "Return date is required"),
  customerId: z.string().nullable().optional(),
  customerName: z.string().optional(),
  consumerNumber: z.string().optional(),
  mobileNumber: z.string().optional(),
  address: z.string().optional(),
  staffId: z.string().optional(),
  remarks: z.string().optional()
});

export async function submitRegulatorReturn(data) {
  try {
    const user = await checkAuth([]);
    const parsed = RegulatorReturnSchema.parse(data);

    const record = await prisma.regulatorReturn.create({
      data: {
        serialNumber: parsed.serialNumber,
        returnDate: new Date(parsed.returnDate),
        customerId: parsed.customerId || null,
        customerName: parsed.customerName || null,
        consumerNumber: parsed.consumerNumber || null,
        mobileNumber: parsed.mobileNumber || null,
        address: parsed.address || null,
        staffId: parsed.staffId || null,
        remarks: parsed.remarks || null
      }
    });

    await writeAudit(user.id, 'INSERT', 'regulator_returns', record.id, null, null, `Regulator return logged.`);
    revalidatePath('/');
    return { success: true, message: `Regulator return for serial ${parsed.serialNumber} successfully logged.` };
  } catch (error) {
    console.error('submitRegulatorReturn error:', error.message);
    return { success: false, error: error.message };
  }
}

// ----------------------------------------------------
// 20. Submit Hose Pipe Transaction (All roles)
// ----------------------------------------------------
const HosePipeTransactionSchema = z.object({
  type: z.enum(['SALE', 'RETURN']),
  quantity: z.number().int().positive(),
  txDate: z.string().min(1, "Date is required"),
  customerId: z.string().nullable().optional(),
  customerName: z.string().optional(),
  consumerNumber: z.string().optional(),
  mobileNumber: z.string().optional(),
  address: z.string().optional(),
  staffId: z.string().optional(),
  remarks: z.string().optional()
});

export async function submitHosePipeTransaction(data) {
  try {
    const user = await checkAuth([]);
    const parsed = HosePipeTransactionSchema.parse(data);

    const record = await prisma.hosePipeTransaction.create({
      data: {
        type: parsed.type,
        quantity: parsed.quantity,
        txDate: new Date(parsed.txDate),
        customerId: parsed.customerId || null,
        customerName: parsed.customerName || null,
        consumerNumber: parsed.consumerNumber || null,
        mobileNumber: parsed.mobileNumber || null,
        address: parsed.address || null,
        staffId: parsed.staffId || null,
        remarks: parsed.remarks || null
      }
    });

    await writeAudit(user.id, 'INSERT', 'hose_pipe_transactions', record.id, null, null, `Hose pipe transaction logged: ${parsed.type}`);
    revalidatePath('/');
    return { success: true, message: `Hose pipe ${parsed.type.toLowerCase()} of quantity ${parsed.quantity} successfully logged.` };
  } catch (error) {
    console.error('submitHosePipeTransaction error:', error.message);
    return { success: false, error: error.message };
  }
}

// ----------------------------------------------------
// 21. Submit Kyc/CardBook Transaction (ADMIN / MANAGER only)
// ----------------------------------------------------
const KycCardBookTransactionSchema = z.object({
  type: z.enum(['EKYC', 'CARDBOOK']),
  count: z.number().int().positive(),
  chargesCollected: z.number().nonnegative(),
  txDate: z.string().min(1, "Date is required"),
  remarks: z.string().optional()
});

export async function submitKycCardBookTransaction(data) {
  try {
    const user = await checkAuth(['ADMIN', 'MANAGER']);
    const parsed = KycCardBookTransactionSchema.parse(data);

    const record = await prisma.kycCardBookTransaction.create({
      data: {
        type: parsed.type,
        count: parsed.count,
        chargesCollected: parsed.chargesCollected,
        txDate: new Date(parsed.txDate),
        remarks: parsed.remarks || null
      }
    });

    await writeAudit(user.id, 'INSERT', 'kyc_card_book_transactions', record.id, null, null, `KYC/Card Book counter logged: ${parsed.type}`);
    revalidatePath('/');
    return { success: true, message: `${parsed.type} entry logged successfully.` };
  } catch (error) {
    console.error('submitKycCardBookTransaction error:', error.message);
    return { success: false, error: error.message };
  }
}

// ----------------------------------------------------
// 22. Submit Auditor Verification (AUDITOR / ADMIN only)
// ----------------------------------------------------
const AuditorVerificationSchema = z.object({
  verificationDate: z.string().min(1, "Verification date is required"),
  imageUrl: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  closingId: z.string().optional().nullable()
});

export async function submitAuditorVerification(data) {
  try {
    const user = await checkAuth(['AUDITOR', 'ADMIN']);
    const parsed = AuditorVerificationSchema.parse(data);

    const record = await prisma.auditorVerification.create({
      data: {
        verificationDate: new Date(parsed.verificationDate),
        imageUrl: parsed.imageUrl || null,
        notes: parsed.notes || null,
        uploadedBy: user.name,
        closingId: parsed.closingId || null
      }
    });

    await writeAudit(user.id, 'INSERT', 'auditor_verifications', record.id, null, null, `Auditor physical verification uploaded.`);
    revalidatePath('/');
    return { success: true, message: `Physical verification report saved.` };
  } catch (error) {
    console.error('submitAuditorVerification error:', error.message);
    return { success: false, error: error.message };
  }
}

// ----------------------------------------------------
// 23. CSV Server-side Export (Role-Safe)
// ----------------------------------------------------
export async function exportCSV(reportType, filters = {}) {
  try {
    const user = await checkAuth([]);

    // Enforce role-based visibility restrictions
    if (user.role === 'EMPLOYEE') {
      if (!['deliveries', 'incidents', 'connections', 'emptyReturns'].includes(reportType)) {
        throw new Error("UNAUTHORIZED: Employees may only export log forms they have access to.");
      }
    } else if (user.role === 'AUDITOR') {
      if (!['invoices', 'closings', 'commercialLedger', 'expenses', 'auditorVerifications'].includes(reportType)) {
        throw new Error("UNAUTHORIZED: Auditor may only export ledger statements and reports.");
      }
    }

    let records = [];
    let headers = [];
    let rows = [];

    if (reportType === 'deliveries') {
      const where = user.role === 'EMPLOYEE' ? { remarks: { contains: `Logged by ${user.name}` } } : {};
      records = await prisma.delivery.findMany({
        where,
        include: { deliveryItems: true },
        orderBy: { deliveryDate: 'desc' }
      });
      headers = ['Date', 'Customer Name', 'Consumer Number', 'Mobile', 'Address', 'Cylinder Type', 'Quantity', 'Rate', 'Total Amount', 'Amount Received', 'Payment Status', 'Verification Status', 'Remarks'];
      rows = records.map(r => {
        const item = r.deliveryItems?.[0] || {};
        return [
          new Date(r.deliveryDate).toLocaleDateString(),
          r.customerName,
          r.consumerNumber || '',
          r.mobileNumber || '',
          r.address || '',
          item.cylinderType || '',
          item.quantityDelivered || 0,
          item.ratePerCylinder || 0,
          r.totalAmount,
          r.amountReceived,
          r.paymentStatus,
          r.verificationStatus,
          r.remarks || ''
        ];
      });
    } else if (reportType === 'invoices') {
      records = await prisma.invoice.findMany({ orderBy: { invoiceDate: 'desc' } });
      headers = ['Invoice Number', 'Date', 'Customer Name', 'Consumer Number', 'Mobile', 'Address', 'Cylinder Type', 'Quantity', 'Rate', 'Total Amount', 'Paid Amount', 'Balance', 'Status'];
      rows = records.map(r => [
        r.invoiceNumber,
        new Date(r.invoiceDate).toLocaleDateString(),
        r.customerName,
        r.consumerNumber || '',
        r.mobileNumber || '',
        r.address || '',
        r.cylinderType,
        r.quantity,
        r.rate,
        r.totalAmount,
        r.paidAmount,
        r.balanceAmount,
        r.paymentStatus
      ]);
    } else if (reportType === 'closings') {
      records = await prisma.dailyClosing.findMany({ orderBy: { closingDate: 'desc' } });
      headers = ['Date', 'Physical 14 Filled', 'Physical 14 Empty', 'Physical 19 Filled', 'Physical 19 Empty', 'Expected 14 Filled', 'Expected 14 Empty', 'Expected 19 Filled', 'Expected 19 Empty', 'Mismatch 14 Filled', 'Mismatch 14 Empty', 'Mismatch 19 Filled', 'Mismatch 19 Empty', 'Cash In Hand', 'Locked', 'Remarks'];
      rows = records.map(r => [
        new Date(r.closingDate).toLocaleDateString(),
        r.physical14Filled,
        r.physical14Empty,
        r.physical19Filled,
        r.physical19Empty,
        r.expected14Filled,
        r.expected14Empty,
        r.expected19Filled,
        r.expected19Empty,
        r.mismatch14Filled,
        r.mismatch14Empty,
        r.mismatch19Filled,
        r.mismatch19Empty,
        r.cashInHand,
        r.isLocked ? 'YES' : 'NO',
        r.remarks || ''
      ]);
    } else if (reportType === 'commercialLedger') {
      records = await prisma.commercialLedger.findMany({ orderBy: { createdAt: 'desc' } });
      headers = ['Customer Name', 'Consumer Number', 'Mobile', 'Address', 'Cylinder Type', 'Delivered', 'Returned', 'Pending Empties', 'Amount Billed', 'Amount Received', 'Amount Pending', 'Due Date', 'Status'];
      rows = records.map(r => [
        r.customerName,
        r.consumerNumber || '',
        r.mobileNumber || '',
        r.address || '',
        r.cylinderType,
        r.quantityDelivered,
        r.emptyReturned,
        r.emptyPending,
        r.amountBilled,
        r.amountReceived,
        r.amountPending,
        r.dueDate ? new Date(r.dueDate).toLocaleDateString() : '',
        r.status
      ]);
    } else if (reportType === 'payments') {
      const where = user.role === 'EMPLOYEE' ? { remarks: { contains: `Logged by ${user.name}` } } : {};
      records = await prisma.payment.findMany({
        where,
        orderBy: { paymentDate: 'desc' }
      });
      headers = ['Date', 'Customer Name', 'Consumer Number', 'Mobile', 'Address', 'Amount', 'Payment Mode', 'Verification Status', 'Remarks'];
      rows = records.map(r => [
        new Date(r.paymentDate).toLocaleDateString(),
        r.customerName,
        r.consumerNumber || '',
        r.mobileNumber || '',
        r.address || '',
        r.amount,
        r.paymentMode,
        r.verificationStatus,
        r.remarks || ''
      ]);
    } else if (reportType === 'expenses') {
      records = await prisma.expense.findMany({ orderBy: { expenseDate: 'desc' } });
      headers = ['Date', 'Category', 'Amount', 'Paid To', 'Payment Mode', 'Reference ID', 'Remarks'];
      rows = records.map(r => [
        new Date(r.expenseDate).toLocaleDateString(),
        r.category,
        r.amount,
        r.paidTo,
        r.paymentMode,
        r.referenceId || '',
        r.remarks || ''
      ]);
    } else if (reportType === 'stockMovement') {
      records = await prisma.inventoryTransaction.findMany({ orderBy: { transactionDate: 'desc' } });
      headers = ['Date', 'Event Type', 'Cylinder Type', 'Filled Change', 'Empty Change', 'Damaged Change', 'Leakage Change', 'Reference ID', 'Remarks'];
      rows = records.map(r => [
        new Date(r.transactionDate).toLocaleDateString(),
        r.eventType,
        r.cylinderType,
        r.filledChange,
        r.emptyChange,
        r.damagedChange,
        r.leakageChange,
        r.referenceId || '',
        r.remarks || ''
      ]);
    } else if (reportType === 'auditorVerifications') {
      records = await prisma.auditorVerification.findMany({ orderBy: { verificationDate: 'desc' } });
      headers = ['Date', 'Uploaded By', 'Notes', 'Closing ID'];
      rows = records.map(r => [
        new Date(r.verificationDate).toLocaleDateString(),
        r.uploadedBy,
        r.notes || '',
        r.closingId || ''
      ]);
    } else if (reportType === 'monthlyArchives') {
      records = await prisma.monthlyArchive.findMany({ orderBy: { createdAt: 'desc' } });
      headers = ['Month/Year', 'Opening Stock', 'Closing Stock', 'Deliveries', 'Invoices', 'Cash Received', 'Expenses', 'Commercial Pending', 'Security Mismatches', 'Created By', 'Created At'];
      rows = records.map(r => [
        `${r.month}/${r.year}`,
        r.openingStock,
        r.closingStock,
        r.totalDeliveries,
        r.totalInvoices,
        r.totalCashReceived,
        r.totalExpenses,
        r.commercialPending,
        r.securityMismatch,
        r.createdBy,
        new Date(r.createdAt).toLocaleDateString()
      ]);
    }

    const csvContent = [
      headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
      ...rows.map(row => row.map(cell => {
        const val = cell === null || cell === undefined ? '' : String(cell);
        return `"${val.replace(/"/g, '""')}"`;
      }).join(','))
    ].join('\n');

    await writeAudit(user.id, 'EXPORT', reportType, 'N/A', null, null, `Exported ${reportType} report as CSV.`);

    return { success: true, csvData: csvContent };
  } catch (error) {
    console.error('exportCSV action error:', error.message);
    return { success: false, error: error.message };
  }
}

// ----------------------------------------------------
// 24. PDF Server-side Export (Role-Safe via pdf-lib)
// ----------------------------------------------------
export async function exportPDF(reportType, filters = {}) {
  try {
    const user = await checkAuth([]);

    // Enforce role-based visibility restrictions
    if (user.role === 'EMPLOYEE') {
      if (!['deliveries', 'incidents', 'connections', 'emptyReturns'].includes(reportType)) {
        throw new Error("UNAUTHORIZED: Employees may only export logs they have logged.");
      }
    } else if (user.role === 'AUDITOR') {
      if (!['invoices', 'closings', 'commercialLedger', 'expenses', 'auditorVerifications'].includes(reportType)) {
        throw new Error("UNAUTHORIZED: Auditor may only export ledger statements and reports.");
      }
    }

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Draw header
    page.drawText('MAA SANTOSHI INDANE GRAMIN VITRAK', { x: 50, y: 750, size: 15, font: fontBold, color: rgb(0.01, 0.09, 0.31) });
    page.drawText('IndianOil LPG Gas Distributor Operations Portal', { x: 50, y: 732, size: 9, font: font, color: rgb(0.95, 0.44, 0.13) });
    page.drawText('------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------', { x: 50, y: 720, size: 7, font: font, color: rgb(0.8, 0.8, 0.8) });

    // Draw metadata
    page.drawText(`REPORT: ${reportType.toUpperCase()}`, { x: 50, y: 695, size: 11, font: fontBold, color: rgb(0.01, 0.09, 0.31) });
    page.drawText(`Generated on: ${new Date().toLocaleString()}`, { x: 50, y: 678, size: 8, font: font, color: rgb(0.4, 0.4, 0.4) });
    page.drawText(`Generated by: ${user.name} (${user.role})`, { x: 50, y: 664, size: 8, font: font, color: rgb(0.4, 0.4, 0.4) });

    let records = [];
    if (reportType === 'deliveries') {
      const where = user.role === 'EMPLOYEE' ? { remarks: { contains: `Logged by ${user.name}` } } : {};
      records = await prisma.delivery.findMany({ where, include: { deliveryItems: true }, orderBy: { deliveryDate: 'desc' }, take: 30 });
    } else if (reportType === 'invoices') {
      records = await prisma.invoice.findMany({ orderBy: { invoiceDate: 'desc' }, take: 30 });
    } else if (reportType === 'closings') {
      records = await prisma.dailyClosing.findMany({ orderBy: { closingDate: 'desc' }, take: 30 });
    } else if (reportType === 'commercialLedger') {
      records = await prisma.commercialLedger.findMany({ orderBy: { createdAt: 'desc' }, take: 30 });
    } else if (reportType === 'payments') {
      const where = user.role === 'EMPLOYEE' ? { remarks: { contains: `Logged by ${user.name}` } } : {};
      records = await prisma.payment.findMany({ where, orderBy: { paymentDate: 'desc' }, take: 30 });
    } else if (reportType === 'expenses') {
      records = await prisma.expense.findMany({ orderBy: { expenseDate: 'desc' }, take: 30 });
    } else if (reportType === 'stockMovement') {
      records = await prisma.inventoryTransaction.findMany({ orderBy: { transactionDate: 'desc' }, take: 30 });
    } else if (reportType === 'auditorVerifications') {
      records = await prisma.auditorVerification.findMany({ orderBy: { verificationDate: 'desc' }, take: 30 });
    } else if (reportType === 'monthlyArchives') {
      records = await prisma.monthlyArchive.findMany({ orderBy: { createdAt: 'desc' }, take: 30 });
    }

    let yOffset = 635;
    page.drawText('SUMMARY DATA (Last 30 entries):', { x: 50, y: yOffset, size: 9, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
    yOffset -= 18;

    if (records.length === 0) {
      page.drawText('No records found.', { x: 50, y: yOffset, size: 9, font: font, color: rgb(0.5, 0.5, 0.5) });
    } else {
      records.forEach((r, idx) => {
        if (yOffset < 50) return;
        let text = '';
        if (reportType === 'deliveries') {
          const item = r.deliveryItems?.[0] || {};
          text = `${idx + 1}. Date: ${new Date(r.deliveryDate).toLocaleDateString()} | Customer: ${r.customerName} | Cylinder: ${item.cylinderType || ''} | Qty: ${item.quantityDelivered || 0} | Paid: INR ${r.amountReceived} (${r.paymentStatus})`;
        } else if (reportType === 'invoices') {
          text = `${idx + 1}. Invoice: ${r.invoiceNumber} | Date: ${new Date(r.invoiceDate).toLocaleDateString()} | Customer: ${r.customerName} | Qty: ${r.quantity} | Total: INR ${r.totalAmount} | Status: ${r.paymentStatus}`;
        } else if (reportType === 'closings') {
          text = `${idx + 1}. Date: ${new Date(r.closingDate).toLocaleDateString()} | 14kg Filled/Empty: ${r.physical14Filled}/${r.physical14Empty} | 19kg Filled/Empty: ${r.physical19Filled}/${r.physical19Empty} | Cash: INR ${r.cashInHand}`;
        } else if (reportType === 'commercialLedger') {
          text = `${idx + 1}. Customer: ${r.customerName} | Cylinder: ${r.cylinderType} | Del/Ret: ${r.quantityDelivered}/${r.emptyReturned} | Pending Outstanding: INR ${r.amountPending}`;
        } else if (reportType === 'payments') {
          text = `${idx + 1}. Date: ${new Date(r.paymentDate).toLocaleDateString()} | Customer: ${r.customerName} | Amount: INR ${r.amount} | Mode: ${r.paymentMode}`;
        } else if (reportType === 'expenses') {
          text = `${idx + 1}. Date: ${new Date(r.expenseDate).toLocaleDateString()} | Category: ${r.category} | Amount: INR ${r.amount} | Paid To: ${r.paidTo}`;
        } else if (reportType === 'stockMovement') {
          text = `${idx + 1}. Date: ${new Date(r.transactionDate).toLocaleDateString()} | Event: ${r.eventType} | Type: ${r.cylinderType} | Filled: ${r.filledChange} | Empty: ${r.emptyChange}`;
        } else if (reportType === 'auditorVerifications') {
          text = `${idx + 1}. Date: ${new Date(r.verificationDate).toLocaleDateString()} | Uploaded By: ${r.uploadedBy} | Notes: ${r.notes || ''}`;
        } else if (reportType === 'monthlyArchives') {
          text = `${idx + 1}. Month: ${r.month}/${r.year} | Deliveries: ${r.totalDeliveries} | Cash: INR ${r.totalCashReceived} | Expenses: INR ${r.totalExpenses} | Created By: ${r.createdBy}`;
        }

        page.drawText(text, { x: 50, y: yOffset, size: 7.5, font: font, color: rgb(0.1, 0.1, 0.1) });
        yOffset -= 16;
      });
    }

    const pdfBytes = await pdfDoc.save();
    const pdfBase64 = Buffer.from(pdfBytes).toString('base64');

    await writeAudit(user.id, 'EXPORT', reportType, 'N/A', null, null, `Exported ${reportType} report as PDF.`);

    return { success: true, pdfData: pdfBase64 };
  } catch (error) {
    console.error('exportPDF action error:', error.message);
    return { success: false, error: error.message };
  }
}

// ----------------------------------------------------
// 25. Monthly Archives
// ----------------------------------------------------
export async function archiveMonth(month, year) {
  try {
    const user = await checkAuth(['ADMIN']);

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Fetch and aggregate operations within the selected month
    const deliveries = await prisma.delivery.findMany({
      where: { deliveryDate: { gte: startDate, lte: endDate } },
      include: { deliveryItems: true }
    });
    const totalDeliveries = deliveries.length;
    
    const invoices = await prisma.invoice.findMany({
      where: { invoiceDate: { gte: startDate, lte: endDate } }
    });
    const totalInvoices = invoices.length;

    const payments = await prisma.payment.findMany({
      where: { paymentDate: { gte: startDate, lte: endDate } }
    });

    const cashFromDeliveries = deliveries
      .filter(d => d.verificationStatus === 'APPROVED')
      .reduce((sum, d) => sum + d.amountReceived, 0);

    const cashFromPayments = payments
      .filter(p => p.verificationStatus === 'APPROVED')
      .reduce((sum, p) => sum + p.amount, 0);

    const totalCashReceived = cashFromDeliveries + cashFromPayments;

    const expenses = await prisma.expense.findMany({
      where: { expenseDate: { gte: startDate, lte: endDate } }
    });
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    const commercialLedger = await prisma.commercialLedger.findMany({
      where: { createdAt: { gte: startDate, lte: endDate } }
    });
    const commercialPending = commercialLedger
      .filter(l => l.status !== 'clear')
      .reduce((sum, l) => sum + l.amountPending, 0);

    const closings = await prisma.dailyClosing.findMany({
      where: { closingDate: { gte: startDate, lte: endDate } }
    });
    const securityMismatch = closings.reduce((sum, c) => 
      sum + Math.abs(c.mismatch14Filled) + Math.abs(c.mismatch14Empty) + Math.abs(c.mismatch19Filled) + Math.abs(c.mismatch19Empty), 0);

    const firstClosing = await prisma.dailyClosing.findFirst({
      where: { closingDate: { gte: startDate, lte: endDate } },
      orderBy: { closingDate: 'asc' }
    });
    const lastClosing = await prisma.dailyClosing.findFirst({
      where: { closingDate: { gte: startDate, lte: endDate } },
      orderBy: { closingDate: 'desc' }
    });

    const openingStock = firstClosing 
      ? `Domestic Filled: ${firstClosing.expected14Filled}, Empty: ${firstClosing.expected14Empty}; Commercial Filled: ${firstClosing.expected19Filled}, Empty: ${firstClosing.expected19Empty}`
      : "N/A";
    const closingStock = lastClosing 
      ? `Domestic Filled: ${lastClosing.physical14Filled}, Empty: ${lastClosing.physical14Empty}; Commercial Filled: ${lastClosing.physical19Filled}, Empty: ${lastClosing.physical19Empty}`
      : "N/A";

    const archive = await prisma.monthlyArchive.create({
      data: {
        month: parseInt(month),
        year: parseInt(year),
        openingStock,
        closingStock,
        totalDeliveries,
        totalInvoices,
        totalCashReceived,
        totalExpenses,
        commercialPending,
        securityMismatch,
        pdfGenerated: true,
        csvGenerated: true,
        createdBy: user.name
      }
    });

    await writeAudit(user.id, 'ARCHIVE_MONTH', 'monthly_archives', archive.id, null, archive, `Archived operations for month ${month}/${year}`);

    revalidatePath('/');
    return { success: true, message: `Month ${month}/${year} successfully archived.`, archive };
  } catch (error) {
    console.error('archiveMonth action error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function resetActiveMonth(archiveId) {
  try {
    const user = await checkAuth(['ADMIN']);
    
    const archive = await prisma.monthlyArchive.findUnique({ where: { id: archiveId } });
    if (!archive) {
      throw new Error("Archive record not found. You must archive the month first before resetting data.");
    }

    const startDate = new Date(archive.year, archive.month - 1, 1);
    const endDate = new Date(archive.year, archive.month, 0, 23, 59, 59, 999);

    await prisma.$transaction(async (tx) => {
      // Purge detailed logs within the archived month to reclaim database space
      await tx.deliveryItem.deleteMany({
        where: { delivery: { deliveryDate: { gte: startDate, lte: endDate } } }
      });
      await tx.delivery.deleteMany({
        where: { deliveryDate: { gte: startDate, lte: endDate } }
      });
      await tx.invoice.deleteMany({
        where: { invoiceDate: { gte: startDate, lte: endDate } }
      });
      await tx.payment.deleteMany({
        where: { paymentDate: { gte: startDate, lte: endDate } }
      });
      await tx.expense.deleteMany({
        where: { expenseDate: { gte: startDate, lte: endDate } }
      });
      await tx.cylinderIncident.deleteMany({
        where: { incidentDate: { gte: startDate, lte: endDate } }
      });
      await tx.dailyClosing.deleteMany({
        where: { closingDate: { gte: startDate, lte: endDate } }
      });
      await tx.inventoryTransaction.deleteMany({
        where: { transactionDate: { gte: startDate, lte: endDate } }
      });
      await tx.commercialLedger.deleteMany({
        where: { createdAt: { gte: startDate, lte: endDate } }
      });
    }, {
      maxWait: 15000,
      timeout: 60000
    });

    await writeAudit(user.id, 'RESET_MONTH', 'monthly_archives', archiveId, null, null, `Reset operations and purged detailed logs for month ${archive.month}/${archive.year}`);

    revalidatePath('/');
    return { success: true, message: `Operational logs for month ${archive.month}/${archive.year} successfully purged from database.` };
  } catch (error) {
    console.error('resetActiveMonth action error:', error.message);
    return { success: false, error: error.message };
  }
}

// ----------------------------------------------------
// 26. Load Cycle tracking
// ----------------------------------------------------
export async function startLoadCycle(data) {
  try {
    const user = await checkAuth(['ADMIN', 'MANAGER']);
    
    // Close any other active cycles
    await prisma.loadCycle.updateMany({
      where: { status: 'active' },
      data: {
        status: 'closed',
        closedAt: new Date()
      }
    });

    const inventory = await prisma.inventory.findMany();
    const domesticInv = inventory.find(i => i.cylinderType === 'DOMESTIC_14_2') || { filledStock: 0, emptyStock: 0 };
    const commercialInv = inventory.find(i => i.cylinderType === 'COMMERCIAL_19') || { filledStock: 0, emptyStock: 0 };

    const loadCycle = await prisma.loadCycle.create({
      data: {
        loadNumber: data.loadNumber,
        loadDate: new Date(),
        loadType: data.loadType || 'MIXED',
        openingStock: `Domestic Filled: ${domesticInv.filledStock}, Empty: ${domesticInv.emptyStock}; Commercial Filled: ${commercialInv.filledStock}, Empty: ${commercialInv.emptyStock}`,
        cylindersReceived: parseInt(data.cylindersReceived) || 0,
        status: 'active'
      }
    });

    await writeAudit(user.id, 'START_LOAD_CYCLE', 'load_cycles', loadCycle.id, null, loadCycle, `Started Load Cycle #${data.loadNumber}`);
    revalidatePath('/');
    return { success: true, message: `Load Cycle #${data.loadNumber} successfully started.` };
  } catch (error) {
    console.error('startLoadCycle error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function closeLoadCycle(id, mismatchCount = 0) {
  try {
    const user = await checkAuth(['ADMIN', 'MANAGER']);

    const cycle = await prisma.loadCycle.findUnique({ where: { id } });
    if (!cycle) {
      throw new Error("Load cycle not found.");
    }

    const inventory = await prisma.inventory.findMany();
    const domesticInv = inventory.find(i => i.cylinderType === 'DOMESTIC_14_2') || { filledStock: 0, emptyStock: 0 };
    const commercialInv = inventory.find(i => i.cylinderType === 'COMMERCIAL_19') || { filledStock: 0, emptyStock: 0 };

    const updated = await prisma.loadCycle.update({
      where: { id },
      data: {
        status: 'closed',
        closedAt: new Date(),
        closingBalance: `Domestic Filled: ${domesticInv.filledStock}, Empty: ${domesticInv.emptyStock}; Commercial Filled: ${commercialInv.filledStock}, Empty: ${commercialInv.emptyStock}`,
        mismatch: parseInt(mismatchCount)
      }
    });

    await writeAudit(user.id, 'CLOSE_LOAD_CYCLE', 'load_cycles', id, cycle, updated, `Closed Load Cycle #${cycle.loadNumber} with mismatch of ${mismatchCount}`);
    revalidatePath('/');
    return { success: true, message: `Load Cycle #${cycle.loadNumber} successfully closed.` };
  } catch (error) {
    console.error('closeLoadCycle error:', error.message);
    return { success: false, error: error.message };
  }
}

