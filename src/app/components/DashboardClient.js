'use client';

import React, { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { 
  LayoutDashboard, 
  Truck, 
  Receipt, 
  UserPlus, 
  Lock, 
  AlertOctagon, 
  DollarSign, 
  Users, 
  FileText, 
  LogOut, 
  Search, 
  Bell, 
  AlertTriangle, 
  TrendingUp, 
  CheckCircle,
  Plus,
  RefreshCw,
  ClipboardCheck,
  ShieldCheck,
  ShieldAlert,
  Printer,
  Edit,
  Trash2,
  Calendar,
  ChevronRight,
  Filter,
  Package,
  Info,
  Database
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import * as actions from '../actions';
import GenericFormShell from './GenericFormShell';

export default function DashboardClient({ initialData, user }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeForm, setActiveForm] = useState(null);
  const [dbData, setDbData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [successFormPayload, setSuccessFormPayload] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [printData, setPrintData] = useState(null);

  // Selected report type
  const [selectedReportType, setSelectedReportType] = useState(
    user.role === 'EMPLOYEE' ? 'deliveries' : (user.role === 'AUDITOR' ? 'invoices' : 'deliveries')
  );

  // Monthly Archive Form states
  const [archiveMonthState, setArchiveMonthState] = useState(new Date().getMonth() + 1);
  const [archiveYearState, setArchiveYearState] = useState(new Date().getFullYear());

  // Load Cycle Form states
  const [newLoadNumber, setNewLoadNumber] = useState('');
  const [newLoadType, setNewLoadType] = useState('MIXED');
  const [newCylindersReceived, setNewCylindersReceived] = useState(0);
  const [closeMismatchCount, setCloseMismatchCount] = useState(0);
  const [showCloseCycleModal, setShowCloseCycleModal] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(null);
  const [showStartCycleModal, setShowStartCycleModal] = useState(false);

  // Verification Edit/Rejection States
  const [verifyingItem, setVerifyingItem] = useState(null);
  const [rejectingItem, setRejectingItem] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [correctedValues, setCorrectedValues] = useState({});

  const isAdmin = user.role === 'ADMIN' || user.role === 'MANAGER';
  const isEmployee = user.role === 'EMPLOYEE';
  const isAuditor = user.role === 'AUDITOR';

  // Set default tab
  useEffect(() => {
    if (isEmployee) {
      setActiveTab('dashboard'); // Employee dashboard is quick action cards + entries
    } else if (isAuditor) {
      setActiveTab('dashboard');
    }
  }, [user.role]);

  // Load Data Helper
  const loadData = async () => {
    setIsLoading(true);
    const res = await actions.getDashboardData();
    if (res.success) {
      setDbData(res.data);
    } else {
      showFeedback('error', 'Reconciliation failed to load.');
    }
    setIsLoading(false);
  };

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  // 12 Forms Initial States
  const [customerForm, setCustomerForm] = useState({
    name: '',
    consumerNumber: '',
    mobile: '',
    address: '',
    customerType: 'domestic',
    creditAllowed: false
  });

  const [domesticForm, setDomesticForm] = useState({
    deliveryDate: new Date().toISOString().split('T')[0],
    customerId: '',
    linkExistingCustomer: false,
    customerName: '',
    consumerNumber: '',
    mobileNumber: '',
    address: '',
    employeeId: dbData.employees[0]?.id || '',
    quantityDelivered: 1,
    emptyReturned: 1,
    paymentMode: 'CASH',
    amountReceived: 950,
    ratePerCylinder: 950,
    dacCode: '',
    dacVerified: false,
    remarks: ''
  });

  const [commercialForm, setCommercialForm] = useState({
    deliveryDate: new Date().toISOString().split('T')[0],
    customerId: '',
    linkExistingCustomer: false,
    customerName: '',
    consumerNumber: '',
    mobileNumber: '',
    address: '',
    employeeId: dbData.employees[0]?.id || '',
    quantityDelivered: 1,
    emptyReturned: 1,
    paymentMode: 'CREDIT',
    amountReceived: 0,
    ratePerCylinder: 1950,
    remarks: ''
  });

  const [connectionForm, setConnectionForm] = useState({
    customerName: '',
    mobile: '',
    address: '',
    connectionType: 'SINGLE_BOTTLE',
    relationshipId: '',
    upgradeType: 'NEW',
    stoveIncluded: false,
    regulatorIncluded: true,
    hosePipeIncluded: true,
    lpgCardBookRequired: true,
    eKycDone: true,
    eKycCharges: 50.0,
    lpgCardBookCharges: 100.0,
    totalAmount: 3750.0,
    amountPaid: 3750.0,
    paymentMode: 'CASH',
    staffId: dbData.employees[0]?.id || '',
    connectionDate: new Date().toISOString().split('T')[0],
    remarks: ''
  });

  const [emptyReturnForm, setEmptyReturnForm] = useState({
    customerId: '',
    linkExistingCustomer: false,
    customerName: '',
    consumerNumber: '',
    mobileNumber: '',
    address: '',
    quantity: 1,
    cylinderType: 'DOMESTIC_14_2',
    returnDate: new Date().toISOString().split('T')[0],
    remarks: ''
  });

  const [loadForm, setLoadForm] = useState({
    loadNumber: '',
    arrivalDate: new Date().toISOString().split('T')[0],
    vehicleNumber: '',
    pattern: 'DOMESTIC_ONLY',
    totalCylinders: 342,
    domesticFilled: 342,
    commercialFilled: 0,
    emptyReturned: 342,
    damagedFound: 0,
    leakageFound: 0,
    laborPayment: 1500,
    remarks: '',
    staffNames: 'Ramesh Singh, Sunil Kumar'
  });

  const [closingForm, setClosingForm] = useState({
    closingDate: new Date().toISOString().split('T')[0],
    physical14Filled: 0,
    physical14Empty: 550,
    physical19Filled: 0,
    physical19Empty: 0,
    physicalDamaged: 0,
    physicalLeakage: 0,
    cashInHand: 0,
    remarks: ''
  });

  const [incidentForm, setIncidentForm] = useState({
    incidentDate: new Date().toISOString().split('T')[0],
    incidentCategory: 'Cylinder',
    cylinderType: 'DOMESTIC_14_2',
    issueType: 'Leakage',
    quantity: 1,
    regulatorSerialNumber: '',
    hosePipeReturned: false,
    hosePipeQuantity: 0,
    reportedBy: '',
    customerId: '',
    linkExistingCustomer: false,
    customerName: '',
    consumerNumber: '',
    mobileNumber: '',
    address: '',
    detectedBy: dbData.employees[0]?.id || '',
    location: 'godown',
    remarks: '',
    photoUrl: ''
  });

  const [expenseForm, setExpenseForm] = useState({
    expenseDate: new Date().toISOString().split('T')[0],
    category: 'diesel',
    amount: 0,
    paidTo: '',
    paymentMode: 'CASH',
    remarks: ''
  });

  const [paymentForm, setPaymentForm] = useState({
    customerId: '',
    linkExistingCustomer: false,
    customerName: '',
    consumerNumber: '',
    mobileNumber: '',
    address: '',
    amount: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMode: 'CASH',
    remarks: ''
  });

  const [invoiceForm, setInvoiceForm] = useState({
    customerId: '',
    linkExistingCustomer: false,
    customerName: '',
    consumerNumber: '',
    mobileNumber: '',
    address: '',
    cylinderType: 'DOMESTIC_14_2',
    quantity: 1,
    rate: 950,
    paidAmount: 950,
    paymentStatus: 'paid'
  });

  const [stockAdjustmentForm, setStockAdjustmentForm] = useState({
    cylinderType: 'DOMESTIC_14_2',
    filledChange: 0,
    emptyChange: 0,
    damagedChange: 0,
    leakageChange: 0,
    remarks: ''
  });

  const [auditorVerificationForm, setAuditorVerificationForm] = useState({
    verificationDate: new Date().toISOString().split('T')[0],
    imageUrl: '',
    notes: '',
    closingId: ''
  });

  const [showCommercialCustomerModal, setShowCommercialCustomerModal] = useState(false);
  const [newCommercialCustomer, setNewCommercialCustomer] = useState({
    name: '',
    contactPerson: '',
    mobile: '',
    address: '',
    gstin: '',
    category: 'Hotel',
    creditAllowed: true,
    openingOutstanding: 0
  });

  // Prepare stock movement chart data from daily EOD closures
  const chartData = [...(dbData.dailyClosings || [])]
    .reverse()
    .slice(-7)
    .map(c => ({
      date: new Date(c.closingDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      '14.2 kg Filled': c.physical14Filled,
      '19 kg Filled': c.physical19Filled,
      'Empty Stock': c.physical14Empty + c.physical19Empty
    }));

  // Calculate pricing for connections
  const calculateConnectionPricing = (form) => {
    const isSingle = form.connectionType === 'SINGLE_BOTTLE';
    const cylDep = isSingle ? 2200.0 : 4400.0;
    const regDep = form.regulatorIncluded ? 250.0 : 0.0;
    const pipe = form.hosePipeIncluded ? 150.0 : 0.0;
    const book = form.lpgCardBookRequired ? (parseFloat(form.lpgCardBookCharges) || 100.0) : 0.0;
    const install = 300.0;
    const stoveCharge = form.stoveIncluded ? 1500.0 : 0.0;
    const gasCost = (isSingle ? 1 : 2) * 950.0;
    const kyc = form.eKycDone ? (parseFloat(form.eKycCharges) || 50.0) : 0.0;
    return cylDep + regDep + pipe + book + install + stoveCharge + gasCost + kyc;
  };

  const renderCustomerSection = (formName, formState, setFormState) => {
    const handleCustomerSelect = (customerId) => {
      if (!customerId) {
        setFormState(prev => ({
          ...prev,
          customerId: '',
          customerName: '',
          consumerNumber: '',
          mobileNumber: '',
          address: ''
        }));
        return;
      }
      const customer = dbData.customers?.find(c => c.id === customerId);
      if (customer) {
        setFormState(prev => ({
          ...prev,
          customerId,
          customerName: customer.name || '',
          consumerNumber: customer.consumerNumber || '',
          mobileNumber: customer.mobile || '',
          address: customer.address || ''
        }));
      }
    };

    // Filter commercial customers only for the commercial form
    const customerList = formName === 'commercial' 
      ? (dbData.customers || []).filter(c => c.customerType === 'commercial')
      : (dbData.customers || []);

    return (
      <div className="sm:col-span-2 border border-gray-100 bg-gray-50/50 rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Customer Details</span>
          <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-[#02164F]">
            <input 
              type="checkbox"
              className="w-3.5 h-3.5 rounded border-gray-300 text-[#F37022] focus:ring-[#F37022]"
              checked={formState.linkExistingCustomer}
              onChange={e => {
                const checked = e.target.checked;
                setFormState(prev => ({ 
                  ...prev, 
                  linkExistingCustomer: checked,
                  customerId: checked ? (customerList[0]?.id || '') : '',
                  customerName: '',
                  consumerNumber: '',
                  mobileNumber: '',
                  address: ''
                }));
                if (checked && customerList[0]) {
                  handleCustomerSelect(customerList[0].id);
                }
              }}
            />
            <span>Link to Registered Customer</span>
          </label>
        </div>

        {formState.linkExistingCustomer && (
          <div className="flex flex-col gap-1 text-xs">
            <div className="flex justify-between items-center mb-1">
              <label className="font-semibold text-gray-700">Select Customer*</label>
              {formName === 'commercial' && isAdmin && (
                <button 
                  type="button"
                  onClick={() => setShowCommercialCustomerModal(true)}
                  className="text-[10px] text-[#F37022] hover:underline font-bold"
                >
                  + Add New Commercial Customer
                </button>
              )}
            </div>
            <select 
              required
              className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none bg-white w-full"
              value={formState.customerId} 
              onChange={e => handleCustomerSelect(e.target.value)}
            >
              <option value="">-- Choose Customer --</option>
              {customerList.map(c => (
                <option key={c.id} value={c.id}>{c.name} {c.consumerNumber ? `(${c.consumerNumber})` : ''}</option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1 text-xs">
            <label className="font-semibold text-gray-700">Customer Name*</label>
            <input 
              type="text" 
              required 
              placeholder="e.g. Ramesh Kumar"
              className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none bg-white" 
              value={formState.customerName || ''} 
              onChange={e => setFormState(prev => ({ ...prev, customerName: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1 text-xs">
            <label className="font-semibold text-gray-700">Consumer Number</label>
            <input 
              type="text" 
              placeholder="e.g. 750012903"
              className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none bg-white" 
              value={formState.consumerNumber || ''} 
              onChange={e => setFormState(prev => ({ ...prev, consumerNumber: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1 text-xs">
            <label className="font-semibold text-gray-700">Mobile Number</label>
            <input 
              type="text" 
              placeholder="e.g. 9876543210"
              className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none bg-white" 
              value={formState.mobileNumber || ''} 
              onChange={e => setFormState(prev => ({ ...prev, mobileNumber: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1 text-xs">
            <label className="font-semibold text-gray-700">Address</label>
            <input 
              type="text" 
              placeholder="e.g. Village Rampur"
              className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none bg-white" 
              value={formState.address || ''} 
              onChange={e => setFormState(prev => ({ ...prev, address: e.target.value }))}
            />
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (activeForm === 'connection') {
      const total = calculateConnectionPricing(connectionForm);
      setConnectionForm(prev => {
        const keepPaidInSync = prev.amountPaid === prev.totalAmount || prev.amountPaid === 0;
        return {
          ...prev,
          totalAmount: total,
          amountPaid: keepPaidInSync ? total : prev.amountPaid
        };
      });
    }
  }, [
    connectionForm.connectionType,
    connectionForm.regulatorIncluded,
    connectionForm.hosePipeIncluded,
    connectionForm.lpgCardBookRequired,
    connectionForm.lpgCardBookCharges,
    connectionForm.stoveIncluded,
    connectionForm.eKycDone,
    connectionForm.eKycCharges,
    activeForm
  ]);

  // Submit Operations
  const handleFormSubmit = async (formType) => {
    setIsSubmitting(true);
    let res;
    let details = {};

    try {
      if (formType === 'customer') {
        res = await actions.createCustomer(customerForm);
        details = {
          name: customerForm.name,
          mobile: customerForm.mobile || 'N/A',
          type: customerForm.customerType
        };
      } else if (formType === 'domestic') {
        if (domesticForm.dacCode && !/^\d{6}$/.test(domesticForm.dacCode)) {
          showFeedback('error', 'DAC verification code must be exactly 6 digits and numeric only');
          setIsSubmitting(false);
          return;
        }
        const payload = {
          deliveryDate: domesticForm.deliveryDate,
          customerId: domesticForm.linkExistingCustomer ? domesticForm.customerId : null,
          customerName: domesticForm.customerName,
          consumerNumber: domesticForm.consumerNumber || null,
          mobileNumber: domesticForm.mobileNumber || null,
          address: domesticForm.address || null,
          employeeId: domesticForm.employeeId,
          cylinderType: 'DOMESTIC_14_2',
          quantityDelivered: parseInt(domesticForm.quantityDelivered),
          emptyReturned: parseInt(domesticForm.emptyReturned),
          ratePerCylinder: parseFloat(domesticForm.ratePerCylinder),
          amountReceived: parseFloat(domesticForm.amountReceived),
          dacCode: domesticForm.dacCode || null,
          dacVerified: domesticForm.dacVerified,
          remarks: domesticForm.remarks,
          paymentMode: domesticForm.paymentMode
        };
        res = await actions.submitDelivery(payload);
        details = {
          customer: payload.customerName || 'Walk-in',
          cylinders: `${payload.quantityDelivered} x 14.2 kg`,
          amountReceived: `₹${payload.amountReceived}`,
          rate: `₹${payload.ratePerCylinder}`
        };
      } else if (formType === 'commercial') {
        const payload = {
          deliveryDate: commercialForm.deliveryDate,
          customerId: commercialForm.linkExistingCustomer ? commercialForm.customerId : null,
          customerName: commercialForm.customerName,
          consumerNumber: commercialForm.consumerNumber || null,
          mobileNumber: commercialForm.mobileNumber || null,
          address: commercialForm.address || null,
          employeeId: commercialForm.employeeId,
          cylinderType: 'COMMERCIAL_19',
          quantityDelivered: parseInt(commercialForm.quantityDelivered),
          emptyReturned: parseInt(commercialForm.emptyReturned),
          ratePerCylinder: parseFloat(commercialForm.ratePerCylinder),
          amountReceived: parseFloat(commercialForm.amountReceived),
          remarks: commercialForm.remarks,
          paymentMode: commercialForm.paymentMode
        };
        res = await actions.submitDelivery(payload);
        details = {
          customer: payload.customerName || 'Direct',
          cylinders: `${payload.quantityDelivered} x 19 kg`,
          amountReceived: `₹${payload.amountReceived}`,
          rate: `₹${payload.ratePerCylinder}`
        };
      } else if (formType === 'connection') {
        const payload = {
          ...connectionForm,
          eKycCharges: parseFloat(connectionForm.eKycCharges),
          lpgCardBookCharges: parseFloat(connectionForm.lpgCardBookCharges),
          totalAmount: parseFloat(connectionForm.totalAmount),
          amountPaid: parseFloat(connectionForm.amountPaid)
        };
        res = await actions.submitConnection(payload);
        details = {
          customer: connectionForm.customerName,
          connectionType: connectionForm.connectionType,
          totalAmount: `₹${payload.totalAmount}`,
          paid: `₹${payload.amountPaid}`
        };
      } else if (formType === 'empty_return') {
        const payload = {
          customerId: emptyReturnForm.linkExistingCustomer ? emptyReturnForm.customerId : null,
          customerName: emptyReturnForm.customerName,
          consumerNumber: emptyReturnForm.consumerNumber || null,
          mobileNumber: emptyReturnForm.mobileNumber || null,
          address: emptyReturnForm.address || null,
          quantity: parseInt(emptyReturnForm.quantity),
          cylinderType: emptyReturnForm.cylinderType,
          returnDate: emptyReturnForm.returnDate,
          remarks: emptyReturnForm.remarks
        };
        res = await actions.submitEmptyReturn(payload);
        details = {
          customer: payload.customerName,
          quantity: `${payload.quantity} cylinders`,
          cylinderType: payload.cylinderType === 'DOMESTIC_14_2' ? '14.2 kg Domestic' : '19 kg Commercial'
        };
      } else if (formType === 'load') {
        const payload = {
          ...loadForm,
          totalCylinders: parseInt(loadForm.totalCylinders),
          domesticFilled: parseInt(loadForm.domesticFilled),
          commercialFilled: parseInt(loadForm.commercialFilled),
          emptyReturned: parseInt(loadForm.emptyReturned),
          damagedFound: parseInt(loadForm.damagedFound),
          leakageFound: parseInt(loadForm.leakageFound),
          laborPayment: parseFloat(loadForm.laborPayment)
        };
        res = await actions.submitLoad(payload);
        details = {
          loadReference: loadForm.loadNumber,
          totalCylinders: `${payload.totalCylinders} units`,
          domesticFilled: `${payload.domesticFilled} domestic`,
          commercialFilled: `${payload.commercialFilled} commercial`
        };
      } else if (formType === 'closing') {
        const payload = {
          ...closingForm,
          physical14Filled: parseInt(closingForm.physical14Filled),
          physical14Empty: parseInt(closingForm.physical14Empty),
          physical19Filled: parseInt(closingForm.physical19Filled),
          physical19Empty: parseInt(closingForm.physical19Empty),
          physicalDamaged: parseInt(closingForm.physicalDamaged),
          physicalLeakage: parseInt(closingForm.physicalLeakage),
          cashInHand: parseFloat(closingForm.cashInHand)
        };
        res = await actions.submitDailyClosing(payload);
        details = {
          date: closingForm.closingDate,
          domFilled: `${payload.physical14Filled} units`,
          domEmpty: `${payload.physical14Empty} units`,
          cashInHand: `₹${payload.cashInHand}`
        };
      } else if (formType === 'incident') {
        const payload = {
          incidentDate: incidentForm.incidentDate,
          incidentCategory: incidentForm.incidentCategory,
          cylinderType: incidentForm.cylinderType,
          issueType: incidentForm.issueType,
          quantity: parseInt(incidentForm.quantity || 0),
          regulatorSerialNumber: incidentForm.regulatorSerialNumber || null,
          reportedBy: incidentForm.reportedBy,
          customerId: incidentForm.linkExistingCustomer ? incidentForm.customerId : null,
          customerName: incidentForm.customerName || null,
          consumerNumber: incidentForm.consumerNumber || null,
          mobileNumber: incidentForm.mobileNumber || null,
          address: incidentForm.address || null,
          detectedBy: incidentForm.detectedBy,
          location: incidentForm.location,
          remarks: incidentForm.remarks,
          photoUrl: incidentForm.photoUrl,
          hosePipeReturned: incidentForm.hosePipeReturned,
          hosePipeQuantity: parseInt(incidentForm.hosePipeQuantity || 0)
        };
        res = await actions.submitIncident(payload);
        details = {
          category: incidentForm.incidentCategory,
          issue: incidentForm.issueType,
          quantity: `${payload.quantity} units`,
          reportedBy: incidentForm.reportedBy || user.name
        };
      } else if (formType === 'expense') {
        const payload = {
          ...expenseForm,
          amount: parseFloat(expenseForm.amount)
        };
        res = await actions.submitExpense(payload);
        details = {
          category: expenseForm.category,
          amount: `₹${payload.amount}`,
          paidTo: expenseForm.paidTo
        };
      } else if (formType === 'payment') {
        const payload = {
          customerId: paymentForm.linkExistingCustomer ? paymentForm.customerId : null,
          customerName: paymentForm.customerName,
          consumerNumber: paymentForm.consumerNumber || null,
          mobileNumber: paymentForm.mobileNumber || null,
          address: paymentForm.address || null,
          amount: parseFloat(paymentForm.amount),
          paymentDate: paymentForm.paymentDate,
          paymentMode: paymentForm.paymentMode,
          remarks: paymentForm.remarks
        };
        res = await actions.submitPayment(payload);
        details = {
          customer: payload.customerName,
          amount: `₹${payload.amount}`,
          paymentMode: paymentForm.paymentMode
        };
      } else if (formType === 'invoice') {
        const payload = {
          customerId: invoiceForm.linkExistingCustomer ? invoiceForm.customerId : null,
          customerName: invoiceForm.customerName,
          consumerNumber: invoiceForm.consumerNumber || null,
          mobileNumber: invoiceForm.mobileNumber || null,
          address: invoiceForm.address || null,
          cylinderType: invoiceForm.cylinderType,
          quantity: parseInt(invoiceForm.quantity),
          rate: parseFloat(invoiceForm.rate),
          paidAmount: parseFloat(invoiceForm.paidAmount),
          paymentStatus: invoiceForm.paymentStatus
        };
        res = await actions.createInvoice(payload);
        details = {
          customer: payload.customerName,
          amount: `₹${payload.quantity * payload.rate}`,
          status: invoiceForm.paymentStatus
        };
      } else if (formType === 'stock_adjustment') {
        const payload = {
          ...stockAdjustmentForm,
          filledChange: parseInt(stockAdjustmentForm.filledChange),
          emptyChange: parseInt(stockAdjustmentForm.emptyChange),
          damagedChange: parseInt(stockAdjustmentForm.damagedChange),
          leakageChange: parseInt(stockAdjustmentForm.leakageChange)
        };
        res = await actions.createStockAdjustment(payload);
        details = {
          cylinderType: stockAdjustmentForm.cylinderType === 'DOMESTIC_14_2' ? '14.2 kg Domestic' : '19 kg Commercial',
          reason: stockAdjustmentForm.remarks,
          adjustments: `F:${payload.filledChange} E:${payload.emptyChange} D:${payload.damagedChange} L:${payload.leakageChange}`
        };
      } else if (formType === 'auditor_verification') {
        res = await actions.submitAuditorVerification(auditorVerificationForm);
        details = {
          date: auditorVerificationForm.verificationDate,
          notes: auditorVerificationForm.notes
        };
      }

      if (res && res.success) {
        setSuccessFormPayload({
          id: res.id || `REC-${Date.now().toString().slice(-6).toUpperCase()}`,
          message: res.message,
          status: isEmployee ? 'PENDING' : 'APPROVED',
          details
        });
        showFeedback('success', res.message);
        loadData();
      } else {
        showFeedback('error', res?.error || 'Failed to submit form');
      }
    } catch (e) {
      showFeedback('error', e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetActiveForm = () => {
    setSuccessFormPayload(null);
    setActiveForm(null);
  };

  const handleCreateCommercialCustomer = async () => {
    setIsSubmitting(true);
    try {
      const res = await actions.createCommercialCustomer({
        ...newCommercialCustomer,
        openingOutstanding: parseFloat(newCommercialCustomer.openingOutstanding || 0)
      });
      if (res && res.success) {
        showFeedback('success', res.message);
        setShowCommercialCustomerModal(false);
        await loadData();
        setCommercialForm(prev => ({
          ...prev,
          customerId: res.customer.id
        }));
        setNewCommercialCustomer({
          name: '',
          contactPerson: '',
          mobile: '',
          address: '',
          gstin: '',
          category: 'Hotel',
          creditAllowed: true,
          openingOutstanding: 0
        });
      } else {
        showFeedback('error', res?.error || 'Failed to create commercial customer');
      }
    } catch (e) {
      showFeedback('error', e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerPrintJob = (type, data) => {
    setPrintData({ type, ...data });
    setTimeout(() => {
      window.print();
      setPrintData(null);
    }, 150);
  };

  const handleCSVDownload = async (type) => {
    setIsLoading(true);
    try {
      const res = await actions.exportCSV(type);
      if (res.success && res.csvData) {
        const blob = new Blob([res.csvData], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `msigv-${type}-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showFeedback('success', `${type.toUpperCase()} CSV exported successfully`);
      } else {
        showFeedback('error', res.error || 'Failed to export CSV');
      }
    } catch (err) {
      showFeedback('error', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePDFDownload = async (type) => {
    setIsLoading(true);
    try {
      const res = await actions.exportPDF(type);
      if (res.success && res.pdfData) {
        const byteCharacters = atob(res.pdfData);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `msigv-${type}-${new Date().toISOString().split('T')[0]}.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showFeedback('success', `${type.toUpperCase()} PDF exported successfully`);
      } else {
        showFeedback('error', res.error || 'Failed to export PDF');
      }
    } catch (err) {
      showFeedback('error', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuditorVerificationSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await actions.submitAuditorVerification(auditorVerificationForm);
      if (res && res.success) {
        showFeedback('success', res.message);
        setAuditorVerificationForm({
          verificationDate: new Date().toISOString().split('T')[0],
          imageUrl: '',
          notes: '',
          closingId: ''
        });
        await loadData();
      } else {
        showFeedback('error', res?.error || 'Failed to submit verification');
      }
    } catch (err) {
      showFeedback('error', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Verification Approvals
  const handleApproveEntry = async (item) => {
    // Show edit overlay for approval
    setVerifyingItem(item);
    // Initialize corrected values
    if (item.type === 'DELIVERY') {
      setCorrectedValues({
        quantityDelivered: item.deliveryItems?.[0]?.quantityDelivered || 1,
        emptyReturned: item.deliveryItems?.[0]?.emptyReturned || 0,
        ratePerCylinder: item.deliveryItems?.[0]?.ratePerCylinder || 950,
        amountReceived: item.amountReceived || 0
      });
    } else if (item.type === 'CONNECTION') {
      setCorrectedValues({
        amountPaid: item.amountPaid || 0
      });
    } else if (item.type === 'EMPTY_RETURN') {
      setCorrectedValues({
        quantity: item.quantity || 1
      });
    } else if (item.type === 'PAYMENT') {
      setCorrectedValues({
        amount: item.amount || 0
      });
    } else if (item.type === 'INCIDENT') {
      setCorrectedValues({
        quantity: item.quantity || 1
      });
    }
  };

  const submitApprove = async () => {
    if (!verifyingItem) return;
    setIsLoading(true);
    const res = await actions.approveVerificationEntry(verifyingItem.id, verifyingItem.type, correctedValues);
    if (res.success) {
      showFeedback('success', res.message);
      setVerifyingItem(null);
      loadData();
    } else {
      showFeedback('error', res.error);
    }
    setIsLoading(false);
  };

  const handleRejectEntry = (item) => {
    setRejectingItem(item);
    setRejectionReason('');
  };

  const submitReject = async () => {
    if (!rejectingItem || !rejectionReason.trim()) return;
    setIsLoading(true);
    const res = await actions.rejectVerificationEntry(rejectingItem.id, rejectingItem.type, rejectionReason);
    if (res.success) {
      showFeedback('success', res.message);
      setRejectingItem(null);
      loadData();
    } else {
      showFeedback('error', res.error);
    }
    setIsLoading(false);
  };

  const handleStartLoadCycle = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await actions.startLoadCycle({
        loadNumber: newLoadNumber,
        loadType: newLoadType,
        cylindersReceived: parseInt(newCylindersReceived) || 0
      });
      if (res && res.success) {
        showFeedback('success', res.message);
        setNewLoadNumber('');
        setNewLoadType('MIXED');
        setNewCylindersReceived(0);
        setShowStartCycleModal(false);
        await loadData();
      } else {
        showFeedback('error', res?.error || 'Failed to start load cycle');
      }
    } catch (err) {
      showFeedback('error', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseLoadCycle = async () => {
    if (!dbData.activeLoadCycle) return;
    setIsSubmitting(true);
    try {
      const res = await actions.closeLoadCycle(dbData.activeLoadCycle.id, parseInt(closeMismatchCount) || 0);
      if (res && res.success) {
        showFeedback('success', res.message);
        setShowCloseCycleModal(false);
        setCloseMismatchCount(0);
        await loadData();
      } else {
        showFeedback('error', res?.error || 'Failed to close load cycle');
      }
    } catch (err) {
      showFeedback('error', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchiveMonth = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await actions.archiveMonth(archiveMonthState, archiveYearState);
      if (res && res.success) {
        showFeedback('success', res.message);
        await loadData();
      } else {
        showFeedback('error', res?.error || 'Failed to generate archive');
      }
    } catch (err) {
      showFeedback('error', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetActiveMonth = async (archiveId) => {
    setIsSubmitting(true);
    try {
      const res = await actions.resetActiveMonth(archiveId);
      if (res && res.success) {
        showFeedback('success', res.message);
        setShowArchiveConfirm(null);
        await loadData();
      } else {
        showFeedback('error', res?.error || 'Failed to purge data');
      }
    } catch (err) {
      showFeedback('error', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAvailableReports = () => {
    const allReports = [
      { id: 'deliveries', name: 'Refill Deliveries' },
      { id: 'invoices', name: 'Commercial Invoices' },
      { id: 'closings', name: 'Daily EOD Closings' },
      { id: 'commercialLedger', name: 'Commercial Ledger' },
      { id: 'expenses', name: 'Expense Statements' },
      { id: 'connections', name: 'SBC/DBC Connections' },
      { id: 'emptyReturns', name: 'Empty Returns Log' },
      { id: 'incidents', name: 'Defect/Leakage Incidents' },
      { id: 'auditorVerifications', name: 'Auditor Verifications' },
      { id: 'monthlyArchives', name: 'Archived Month Summaries' }
    ];

    if (user.role === 'EMPLOYEE') {
      return allReports.filter(r => ['deliveries', 'incidents', 'connections', 'emptyReturns'].includes(r.id));
    } else if (user.role === 'AUDITOR') {
      return allReports.filter(r => ['invoices', 'closings', 'commercialLedger', 'expenses', 'auditorVerifications'].includes(r.id));
    }

    return allReports;
  };

  // Domestic Stock Threshold calculation
  const domesticFilledStock = dbData.inventory?.domestic?.filledStock || 0;
  let stockThreshold = 'Safe';
  let stockThresholdColor = 'var(--color-success)';
  if (domesticFilledStock <= 0) {
    stockThreshold = 'Stock Out';
    stockThresholdColor = 'var(--color-danger)';
  } else if (domesticFilledStock <= 50) {
    stockThreshold = 'Critical';
    stockThresholdColor = 'var(--color-danger)';
  } else if (domesticFilledStock <= 100) {
    stockThreshold = 'Moderate';
    stockThresholdColor = 'var(--color-warning)';
  }

  const filteredDeliveries = (dbData.deliveries || []).filter(del => {
    const term = searchQuery.toLowerCase();
    if (!term) return true;
    return (
      (del.customerName || '').toLowerCase().includes(term) ||
      (del.consumerNumber || '').toLowerCase().includes(term) ||
      del.deliveryItems?.[0]?.dacCode?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="app-container">
      {/* Toast Alert */}
      {feedback && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 10000,
          background: feedback.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)',
          color: '#fff',
          padding: '0.75rem 1.25rem',
          borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
          fontWeight: 600,
          fontSize: '0.8rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          {feedback.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* LEFT SIDEBAR NAVIGATION */}
      <aside className="app-sidebar print:hidden">
        <div className="brand-section">
          <img src="/logo.svg" alt="IOCL Logo" style={{ width: '36px', height: '40px', objectFit: 'contain' }} />
          <div className="brand-title">
            <h2 className="font-bold text-[#02164F] text-xs leading-tight">Maa Santoshi Indane</h2>
            <p className="text-[9px] text-[#F37022] font-bold uppercase tracking-wider">Gramin Vitrak</p>
          </div>
        </div>

        <nav className="sidebar-nav flex-1 space-y-1">
          {/* Main Command Center dashboard tab */}
          <div 
            className={`nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition ${activeTab === 'dashboard' ? 'bg-[#02164F]/5 text-[#02164F] font-semibold' : 'text-gray-600 hover:bg-gray-50'}`} 
            onClick={() => { setActiveTab('dashboard'); setActiveForm(null); }}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </div>

          {/* Admin Sidebar Links */}
          {isAdmin && (
            <>
              <div 
                className={`nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition ${activeTab === 'forms' ? 'bg-[#02164F]/5 text-[#02164F] font-semibold' : 'text-gray-600 hover:bg-gray-50'}`} 
                onClick={() => { setActiveTab('forms'); setActiveForm(null); }}
              >
                <Plus className="w-4 h-4 text-[#F37022]" />
                <span>Operational Forms</span>
              </div>
              <div 
                className={`nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition ${activeTab === 'commercial' ? 'bg-[#02164F]/5 text-[#02164F] font-semibold' : 'text-gray-600 hover:bg-gray-50'}`} 
                onClick={() => { setActiveTab('commercial'); setActiveForm(null); }}
              >
                <Users className="w-4 h-4" />
                <span>Commercial Credit</span>
              </div>
              <div 
                className={`nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition ${activeTab === 'reports' ? 'bg-[#02164F]/5 text-[#02164F] font-semibold' : 'text-gray-600 hover:bg-gray-50'}`} 
                onClick={() => { setActiveTab('reports'); setActiveForm(null); }}
              >
                <FileText className="w-4 h-4" />
                <span>Reports & Audits</span>
              </div>
              <div 
                className={`nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition ${activeTab === 'closings' ? 'bg-[#02164F]/5 text-[#02164F] font-semibold' : 'text-gray-600 hover:bg-gray-50'}`} 
                onClick={() => { setActiveTab('closings'); setActiveForm(null); }}
              >
                <Lock className="w-4 h-4" />
                <span>Daily Closings</span>
              </div>
              <div 
                className={`nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition ${activeTab === 'staff' ? 'bg-[#02164F]/5 text-[#02164F] font-semibold' : 'text-gray-600 hover:bg-gray-50'}`} 
                onClick={() => { setActiveTab('staff'); setActiveForm(null); }}
              >
                <Users className="w-4 h-4" />
                <span>Staff Control</span>
              </div>
              <div 
                className={`nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition ${activeTab === 'data_management' ? 'bg-[#02164F]/5 text-[#02164F] font-semibold' : 'text-gray-600 hover:bg-gray-50'}`} 
                onClick={() => { setActiveTab('data_management'); setActiveForm(null); }}
              >
                <Database className="w-4 h-4" />
                <span>Data Management</span>
              </div>
            </>
          )}

          {/* Auditor Sidebar Links */}
          {isAuditor && (
            <>
              <div 
                className={`nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition ${activeTab === 'commercial' ? 'bg-[#02164F]/5 text-[#02164F] font-semibold' : 'text-gray-600 hover:bg-gray-50'}`} 
                onClick={() => { setActiveTab('commercial'); setActiveForm(null); }}
              >
                <Users className="w-4 h-4" />
                <span>Commercial Credit</span>
              </div>
              <div 
                className={`nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition ${activeTab === 'reports' ? 'bg-[#02164F]/5 text-[#02164F] font-semibold' : 'text-gray-600 hover:bg-gray-50'}`} 
                onClick={() => { setActiveTab('reports'); setActiveForm(null); }}
              >
                <FileText className="w-4 h-4" />
                <span>Reports & Audits</span>
              </div>
              <div 
                className={`nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition ${activeTab === 'closings' ? 'bg-[#02164F]/5 text-[#02164F] font-semibold' : 'text-gray-600 hover:bg-gray-50'}`} 
                onClick={() => { setActiveTab('closings'); setActiveForm(null); }}
              >
                <Lock className="w-4 h-4" />
                <span>Daily Closings</span>
              </div>
            </>
          )}
        </nav>

        {/* User Card */}
        <div className="sidebar-footer border-t border-[#E8EAF0] pt-4 mt-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#02164F]/10 flex items-center justify-center font-bold text-[#02164F] text-xs">
                {user.name.substring(0,2).toUpperCase()}
              </div>
              <div className="text-xs">
                <p className="font-semibold text-gray-800 leading-tight">{user.name}</p>
                <p className="text-gray-500 capitalize">{user.role.toLowerCase()}</p>
              </div>
            </div>
            <button 
              onClick={() => signOut({ callbackUrl: '/sign-in' })}
              className="p-1 rounded text-red-500 hover:bg-red-50 transition"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* MOBILE HEADER/NAV */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-[#E8EAF0] px-4 flex items-center justify-between z-50 print:hidden">
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="IOCL Logo" className="w-6 h-7 object-contain" />
          <span className="font-bold text-[#02164F] text-xs leading-tight">Maa Santoshi Indane Gramin Vitrak</span>
        </div>
        <button 
          onClick={() => signOut({ callbackUrl: '/sign-in' })} 
          className="text-red-500 p-1 hover:bg-red-50 rounded"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* MAIN CONTAINER */}
      <main className="app-content pt-16 md:pt-6 pb-20 md:pb-6 print:p-0 print:m-0 flex-1">
        {/* TOP STATUS BAR */}
        <div className="top-bar flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6 print:hidden">
          <div className="search-container flex items-center gap-2 bg-white border border-[#E8EAF0] px-3 py-1.5 rounded-lg flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search consumer number, customers or DAC code..." 
              className="w-full text-sm outline-none bg-transparent"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3 justify-end">
            <span className="text-[11px] text-gray-500 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-green-600" />
              <span>Neon Live cloud connection</span>
            </span>
            <button 
              onClick={loadData}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E8EAF0] rounded-lg text-xs font-semibold text-[#02164F] hover:bg-gray-50 transition active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Sync Ledger</span>
            </button>
          </div>
        </div>

        {/* ------------------- OPERATIONAL FORMS PANEL ------------------- */}
        {activeForm ? (
          <div>
            <button 
              onClick={resetActiveForm}
              className="mb-4 inline-flex items-center gap-1 text-xs font-semibold text-[#02164F] hover:underline"
            >
              &larr; Back to Dashboard
            </button>

            {/* Render selected form wrapped in GenericFormShell */}
            {activeForm === 'customer' && (
              <GenericFormShell
                title="1. Customer Creation Form"
                subtitle="Create a domestic/commercial customer profile in the ledger"
                instructions={[
                  "Provide the exact Consumer ID and mobile matches to ensure proper SDMS verification.",
                  "If logged by field employees, the profile sits in verification queue."
                ]}
                isSubmitting={isSubmitting}
                successData={successFormPayload}
                onReset={() => { setSuccessFormPayload(null); setCustomerForm({ name: '', consumerNumber: '', mobile: '', address: '', customerType: 'domestic', creditAllowed: false }); }}
                onClose={resetActiveForm}
                onSubmit={() => handleFormSubmit('customer')}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Customer Full Name*</label>
                    <input 
                      type="text" 
                      required 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none" 
                      value={customerForm.name} 
                      onChange={e => setCustomerForm(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Consumer Number / ID</label>
                    <input 
                      type="text" 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none" 
                      placeholder="e.g. 750012903"
                      value={customerForm.consumerNumber} 
                      onChange={e => setCustomerForm(prev => ({ ...prev, consumerNumber: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Mobile Number</label>
                    <input 
                      type="text" 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none" 
                      value={customerForm.mobile} 
                      onChange={e => setCustomerForm(prev => ({ ...prev, mobile: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Customer Category*</label>
                    <select 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none bg-white"
                      value={customerForm.customerType} 
                      onChange={e => setCustomerForm(prev => ({ ...prev, customerType: e.target.value }))}
                    >
                      <option value="domestic">Domestic (14.2 kg)</option>
                      <option value="commercial">Commercial (19 kg)</option>
                      <option value="institutional">Institutional</option>
                      <option value="industrial">Industrial</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1 text-xs sm:col-span-2">
                    <label className="font-semibold text-gray-700">Detailed Address</label>
                    <textarea 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none h-20"
                      value={customerForm.address} 
                      onChange={e => setCustomerForm(prev => ({ ...prev, address: e.target.value }))}
                    />
                  </div>
                  <div className="flex items-center gap-2 sm:col-span-2 mt-2">
                    <input 
                      type="checkbox" 
                      id="creditAllowed"
                      className="w-4 h-4 rounded border-gray-300"
                      checked={customerForm.creditAllowed} 
                      onChange={e => setCustomerForm(prev => ({ ...prev, creditAllowed: e.target.checked }))}
                    />
                    <label htmlFor="creditAllowed" className="text-xs font-semibold text-gray-700 cursor-pointer">
                      Allow Credit Sales Rollovers
                    </label>
                  </div>
                </div>
              </GenericFormShell>
            )}

            {activeForm === 'domestic' && (
              <GenericFormShell
                title="2. Domestic Refill Delivery Form"
                subtitle="Record domestic LPG sales (14.2 kg cylinder refills)"
                instructions={[
                  "Entering a delivery decrements domestic filled stock and increments empties.",
                  "A delivery status of PENDING does not trigger inventory changes until Approved."
                ]}
                isSubmitting={isSubmitting}
                successData={successFormPayload}
                onReset={() => { setSuccessFormPayload(null); setDomesticForm({ deliveryDate: new Date().toISOString().split('T')[0], customerId: '', linkExistingCustomer: false, customerName: '', consumerNumber: '', mobileNumber: '', address: '', employeeId: dbData.employees[0]?.id || '', quantityDelivered: 1, emptyReturned: 1, paymentMode: 'CASH', amountReceived: 950, ratePerCylinder: 950, dacCode: '', dacVerified: false, remarks: '' }); }}
                onClose={resetActiveForm}
                onSubmit={() => handleFormSubmit('domestic')}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Delivery Date*</label>
                    <input 
                      type="date" 
                      required 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none" 
                      value={domesticForm.deliveryDate} 
                      onChange={e => setDomesticForm(prev => ({ ...prev, deliveryDate: e.target.value }))}
                    />
                  </div>
                  {renderCustomerSection('domestic', domesticForm, setDomesticForm)}
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Delivery Staff*</label>
                    <select 
                      required
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none bg-white"
                      value={domesticForm.employeeId} 
                      onChange={e => setDomesticForm(prev => ({ ...prev, employeeId: e.target.value }))}
                    >
                      <option value="">-- Choose Staff --</option>
                      {dbData.employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Cylinders Delivered (Qty)*</label>
                    <input 
                      type="number" 
                      min="1" 
                      required 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none" 
                      value={domesticForm.quantityDelivered} 
                      onChange={e => setDomesticForm(prev => ({ ...prev, quantityDelivered: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Empties Returned (Qty)</label>
                    <input 
                      type="number" 
                      min="0" 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none" 
                      value={domesticForm.emptyReturned} 
                      onChange={e => setDomesticForm(prev => ({ ...prev, emptyReturned: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">DAC Verification Code (Distributor Authorised Code)</label>
                    <input 
                      type="text" 
                      maxLength={6}
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none" 
                      placeholder="e.g. 123456"
                      value={domesticForm.dacCode} 
                      onChange={e => setDomesticForm(prev => ({ ...prev, dacCode: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Rate per Cylinder (INR)*</label>
                    <input 
                      type="number" 
                      min="0" 
                      required 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none" 
                      value={domesticForm.ratePerCylinder} 
                      onChange={e => setDomesticForm(prev => ({ ...prev, ratePerCylinder: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Payment Method*</label>
                    <select 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none bg-white"
                      value={domesticForm.paymentMode} 
                      onChange={e => setDomesticForm(prev => ({ ...prev, paymentMode: e.target.value }))}
                    >
                      <option value="CASH">Cash in Hand</option>
                      <option value="UPI">UPI Payment</option>
                      <option value="CREDIT">Store Credit (Rollover)</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Amount Received (INR)*</label>
                    <input 
                      type="number" 
                      min="0" 
                      required 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none" 
                      value={domesticForm.amountReceived} 
                      onChange={e => setDomesticForm(prev => ({ ...prev, amountReceived: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-xs sm:col-span-2">
                    <label className="font-semibold text-gray-700">Remarks / Operational Details</label>
                    <input 
                      type="text" 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none" 
                      value={domesticForm.remarks} 
                      onChange={e => setDomesticForm(prev => ({ ...prev, remarks: e.target.value }))}
                    />
                  </div>
                </div>
              </GenericFormShell>
            )}

            {activeForm === 'commercial' && (
              <GenericFormShell
                title="3. Commercial Refill Delivery Form"
                subtitle="Record commercial LPG sales (19 kg cylinder refills)"
                instructions={[
                  "Entering a delivery decrements commercial filled stock and increments commercial empty stock.",
                  "Rollovers and empties pending will automatically update the credit ledger if approved."
                ]}
                isSubmitting={isSubmitting}
                successData={successFormPayload}
                onReset={() => { setSuccessFormPayload(null); setCommercialForm({ deliveryDate: new Date().toISOString().split('T')[0], customerId: '', linkExistingCustomer: false, customerName: '', consumerNumber: '', mobileNumber: '', address: '', employeeId: dbData.employees[0]?.id || '', quantityDelivered: 1, emptyReturned: 1, paymentMode: 'CREDIT', amountReceived: 0, ratePerCylinder: 1950, remarks: '' }); }}
                onClose={resetActiveForm}
                onSubmit={() => handleFormSubmit('commercial')}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Delivery Date*</label>
                    <input 
                      type="date" 
                      required 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none" 
                      value={commercialForm.deliveryDate} 
                      onChange={e => setCommercialForm(prev => ({ ...prev, deliveryDate: e.target.value }))}
                    />
                  </div>
                  {renderCustomerSection('commercial', commercialForm, setCommercialForm)}
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Delivery Staff*</label>
                    <select 
                      required
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none bg-white"
                      value={commercialForm.employeeId} 
                      onChange={e => setCommercialForm(prev => ({ ...prev, employeeId: e.target.value }))}
                    >
                      <option value="">-- Choose Staff --</option>
                      {dbData.employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Cylinders Delivered (Qty)*</label>
                    <input 
                      type="number" 
                      min="1" 
                      required 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none" 
                      value={commercialForm.quantityDelivered} 
                      onChange={e => setCommercialForm(prev => ({ ...prev, quantityDelivered: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Empties Returned (Qty)</label>
                    <input 
                      type="number" 
                      min="0" 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none" 
                      value={commercialForm.emptyReturned} 
                      onChange={e => setCommercialForm(prev => ({ ...prev, emptyReturned: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Rate per Cylinder (INR)*</label>
                    <input 
                      type="number" 
                      min="0" 
                      required 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none" 
                      value={commercialForm.ratePerCylinder} 
                      onChange={e => setCommercialForm(prev => ({ ...prev, ratePerCylinder: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Payment Method*</label>
                    <select 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none bg-white"
                      value={commercialForm.paymentMode} 
                      onChange={e => setCommercialForm(prev => ({ ...prev, paymentMode: e.target.value }))}
                    >
                      <option value="CREDIT">Store Credit (Outstanding)</option>
                      <option value="CASH">Cash Collection</option>
                      <option value="UPI">UPI/Online Payment</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Amount Received (INR)*</label>
                    <input 
                      type="number" 
                      min="0" 
                      required 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none" 
                      value={commercialForm.amountReceived} 
                      onChange={e => setCommercialForm(prev => ({ ...prev, amountReceived: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-xs sm:col-span-2">
                    <label className="font-semibold text-gray-700">Remarks / Operational Details</label>
                    <input 
                      type="text" 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none" 
                      value={commercialForm.remarks} 
                      onChange={e => setCommercialForm(prev => ({ ...prev, remarks: e.target.value }))}
                    />
                  </div>
                </div>
              </GenericFormShell>
            )}

            {activeForm === 'connection' && (
              <GenericFormShell
                title="4. New Connection Form"
                subtitle="Issue a new SBC/DBC connection contract (Domestic)"
                instructions={[
                  "Connection costs are pre-calculated based on state security deposits.",
                  "Single Bottle (SBC) includes 1 cylinder, Double Bottle (DBC) includes 2 cylinders."
                ]}
                isSubmitting={isSubmitting}
                successData={successFormPayload}
                onReset={() => { setSuccessFormPayload(null); setConnectionForm({ customerName: '', mobile: '', address: '', connectionType: 'SINGLE_BOTTLE', relationshipId: '', upgradeType: 'NEW', stoveIncluded: false, regulatorIncluded: true, hosePipeIncluded: true, lpgCardBookRequired: true, eKycDone: true, eKycCharges: 50.0, lpgCardBookCharges: 100.0, totalAmount: 3750.0, amountPaid: 3750.0, paymentMode: 'CASH', staffId: dbData.employees[0]?.id || '', connectionDate: new Date().toISOString().split('T')[0], remarks: '' }); }}
                onClose={resetActiveForm}
                onSubmit={() => handleFormSubmit('connection')}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Applicant Name */}
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Applicant Full Name*</label>
                    <input 
                      type="text" 
                      required 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none" 
                      value={connectionForm.customerName} 
                      onChange={e => setConnectionForm(prev => ({ ...prev, customerName: e.target.value }))}
                    />
                  </div>
                  {/* Mobile */}
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Mobile Number*</label>
                    <input 
                      type="text" 
                      required 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none" 
                      value={connectionForm.mobile} 
                      onChange={e => setConnectionForm(prev => ({ ...prev, mobile: e.target.value }))}
                    />
                  </div>
                  {/* Connection Date */}
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Connection Date*</label>
                    <input 
                      type="date" 
                      required 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none" 
                      value={connectionForm.connectionDate} 
                      onChange={e => setConnectionForm(prev => ({ ...prev, connectionDate: e.target.value }))}
                    />
                  </div>
                  {/* Staff Assigned */}
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Staff Assigned*</label>
                    <select 
                      required
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none bg-white"
                      value={connectionForm.staffId} 
                      onChange={e => setConnectionForm(prev => ({ ...prev, staffId: e.target.value }))}
                    >
                      <option value="">-- Choose Staff --</option>
                      {dbData.employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                      ))}
                    </select>
                  </div>
                  {/* Connection Type */}
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Connection Category (Cylinders)*</label>
                    <select 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none bg-white"
                      value={connectionForm.connectionType} 
                      onChange={e => setConnectionForm(prev => ({ ...prev, connectionType: e.target.value }))}
                    >
                      <option value="SINGLE_BOTTLE">Single Bottle Connection (SBC) [1 Cyl]</option>
                      <option value="DOUBLE_BOTTLE">Double Bottle Connection (DBC) [2 Cyl]</option>
                    </select>
                  </div>
                  {/* Upgrade Type */}
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Upgrade / Connection Type*</label>
                    <select 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none bg-white"
                      value={connectionForm.upgradeType} 
                      onChange={e => setConnectionForm(prev => ({ ...prev, upgradeType: e.target.value }))}
                    >
                      <option value="NEW">New Connection</option>
                      <option value="SINGLE_TO_DOUBLE">Single-to-Double Upgrade</option>
                      <option value="TRANSFER">Transfer Connection</option>
                      <option value="OTHER">Other / Special</option>
                    </select>
                  </div>
                  {/* Existing Relationship ID */}
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Existing Relationship ID (Optional)</label>
                    <input 
                      type="text" 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none" 
                      placeholder="e.g. 700019283"
                      value={connectionForm.relationshipId} 
                      onChange={e => setConnectionForm(prev => ({ ...prev, relationshipId: e.target.value }))}
                    />
                  </div>
                  {/* Payment Mode */}
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Payment Mode*</label>
                    <select 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none bg-white"
                      value={connectionForm.paymentMode} 
                      onChange={e => setConnectionForm(prev => ({ ...prev, paymentMode: e.target.value }))}
                    >
                      <option value="CASH">Cash</option>
                      <option value="UPI">UPI / Online</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                    </select>
                  </div>

                  {/* Hardware details */}
                  <div className="sm:col-span-2 border-t border-gray-100 pt-3 mt-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="flex items-center gap-2 text-xs">
                      <input 
                        type="checkbox" 
                        id="stoveIncluded"
                        className="w-4 h-4 rounded border-gray-300"
                        checked={connectionForm.stoveIncluded} 
                        onChange={e => setConnectionForm(prev => ({ ...prev, stoveIncluded: e.target.checked }))}
                      />
                      <label htmlFor="stoveIncluded" className="font-semibold text-gray-700 cursor-pointer">
                        Gas Stove (+ ₹1,500)
                      </label>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <input 
                        type="checkbox" 
                        id="regulatorIncluded"
                        className="w-4 h-4 rounded border-gray-300"
                        checked={connectionForm.regulatorIncluded} 
                        onChange={e => setConnectionForm(prev => ({ ...prev, regulatorIncluded: e.target.checked }))}
                      />
                      <label htmlFor="regulatorIncluded" className="font-semibold text-gray-700 cursor-pointer">
                        Regulator Deposit (+ ₹250)
                      </label>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <input 
                        type="checkbox" 
                        id="hosePipeIncluded"
                        className="w-4 h-4 rounded border-gray-300"
                        checked={connectionForm.hosePipeIncluded} 
                        onChange={e => setConnectionForm(prev => ({ ...prev, hosePipeIncluded: e.target.checked }))}
                      />
                      <label htmlFor="hosePipeIncluded" className="font-semibold text-gray-700 cursor-pointer">
                        Hose Pipe Sold (+ ₹150)
                      </label>
                    </div>
                  </div>

                  {/* KYC & Cards */}
                  <div className="sm:col-span-2 border-t border-gray-100 pt-3 mt-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs">
                        <input 
                          type="checkbox" 
                          id="eKycDone"
                          className="w-4 h-4 rounded border-gray-300"
                          checked={connectionForm.eKycDone} 
                          onChange={e => setConnectionForm(prev => ({ ...prev, eKycDone: e.target.checked }))}
                        />
                        <label htmlFor="eKycDone" className="font-semibold text-gray-700 cursor-pointer">
                          eKYC Done
                        </label>
                      </div>
                      {connectionForm.eKycDone && (
                        <div className="flex flex-col gap-1 text-xs pl-6">
                          <label className="font-semibold text-gray-600">eKYC Charges (INR)</label>
                          <input 
                            type="number" 
                            min="0"
                            className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none" 
                            value={connectionForm.eKycCharges} 
                            onChange={e => setConnectionForm(prev => ({ ...prev, eKycCharges: e.target.value }))}
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs">
                        <input 
                          type="checkbox" 
                          id="lpgCardBookRequired"
                          className="w-4 h-4 rounded border-gray-300"
                          checked={connectionForm.lpgCardBookRequired} 
                          onChange={e => setConnectionForm(prev => ({ ...prev, lpgCardBookRequired: e.target.checked }))}
                        />
                        <label htmlFor="lpgCardBookRequired" className="font-semibold text-gray-700 cursor-pointer">
                          LPG Card Book Required
                        </label>
                      </div>
                      {connectionForm.lpgCardBookRequired && (
                        <div className="flex flex-col gap-1 text-xs pl-6">
                          <label className="font-semibold text-gray-600">LPG Card Book Charges (INR)</label>
                          <input 
                            type="number" 
                            min="0"
                            className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none" 
                            value={connectionForm.lpgCardBookCharges} 
                            onChange={e => setConnectionForm(prev => ({ ...prev, lpgCardBookCharges: e.target.value }))}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Installation Address */}
                  <div className="flex flex-col gap-1 text-xs sm:col-span-2 border-t border-gray-100 pt-3">
                    <label className="font-semibold text-gray-700">Installation Address*</label>
                    <textarea 
                      required 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none h-16"
                      value={connectionForm.address} 
                      onChange={e => setConnectionForm(prev => ({ ...prev, address: e.target.value }))}
                    />
                  </div>

                  {/* Auto-calculated total and paid */}
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Total Calculated Contract Charge (INR)</label>
                    <div className="border border-[#E8EAF0] bg-gray-50 rounded p-2 text-sm font-bold text-[#02164F]">
                      ₹{connectionForm.totalAmount}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Amount Received from Customer (INR)*</label>
                    <input 
                      type="number" 
                      min="0"
                      required
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none font-bold text-green-700" 
                      value={connectionForm.amountPaid} 
                      onChange={e => setConnectionForm(prev => ({ ...prev, amountPaid: e.target.value }))}
                    />
                  </div>

                  {/* Remarks */}
                  <div className="flex flex-col gap-1 text-xs sm:col-span-2">
                    <label className="font-semibold text-gray-700">Remarks / Operational Details</label>
                    <input 
                      type="text" 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none" 
                      value={connectionForm.remarks} 
                      onChange={e => setConnectionForm(prev => ({ ...prev, remarks: e.target.value }))}
                    />
                  </div>
                </div>
              </GenericFormShell>
            )}

            {activeForm === 'empty_return' && (
              <GenericFormShell
                title="5. Empty Return Form"
                subtitle="Record cylinder returns from a commercial or credit customer"
                instructions={[
                  "Returns update empty stock balances in the godown.",
                  "If commercial, outstanding empty cylinders count decrements in the ledger."
                ]}
                isSubmitting={isSubmitting}
                successData={successFormPayload}
                onReset={() => { setSuccessFormPayload(null); setEmptyReturnForm({ customerId: '', linkExistingCustomer: false, customerName: '', consumerNumber: '', mobileNumber: '', address: '', quantity: 1, cylinderType: 'DOMESTIC_14_2', returnDate: new Date().toISOString().split('T')[0], remarks: '' }); }}
                onClose={resetActiveForm}
                onSubmit={() => handleFormSubmit('empty_return')}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Return Date*</label>
                    <input 
                      type="date" 
                      required 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none" 
                      value={emptyReturnForm.returnDate} 
                      onChange={e => setEmptyReturnForm(prev => ({ ...prev, returnDate: e.target.value }))}
                    />
                  </div>
                  {renderCustomerSection('empty_return', emptyReturnForm, setEmptyReturnForm)}
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Cylinder Type*</label>
                    <select 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none bg-white"
                      value={emptyReturnForm.cylinderType} 
                      onChange={e => setEmptyReturnForm(prev => ({ ...prev, cylinderType: e.target.value }))}
                    >
                      <option value="DOMESTIC_14_2">Domestic (14.2 kg)</option>
                      <option value="COMMERCIAL_19">Commercial (19 kg)</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Quantity Returned*</label>
                    <input 
                      type="number" 
                      min="1" 
                      required 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none" 
                      value={emptyReturnForm.quantity} 
                      onChange={e => setEmptyReturnForm(prev => ({ ...prev, quantity: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-xs sm:col-span-2">
                    <label className="font-semibold text-gray-700">Remarks / Slip Details</label>
                    <input 
                      type="text" 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none" 
                      value={emptyReturnForm.remarks} 
                      onChange={e => setEmptyReturnForm(prev => ({ ...prev, remarks: e.target.value }))}
                    />
                  </div>
                </div>
              </GenericFormShell>
            )}

            {activeForm === 'load' && isAdmin && (
              <GenericFormShell
                title="6. refinery truck Unload Entry Form"
                subtitle="Record incoming truck loads from LPG refinery bottling plants"
                instructions={[
                  "Unloading loads increments filled stocks and decrements empty stocks sent back to the bottling plant.",
                  "This form is strictly restricted to Admin users and updates inventory immediately."
                ]}
                isSubmitting={isSubmitting}
                successData={successFormPayload}
                onReset={() => { setSuccessFormPayload(null); setLoadForm({ loadNumber: '', arrivalDate: new Date().toISOString().split('T')[0], vehicleNumber: '', pattern: 'DOMESTIC_ONLY', totalCylinders: 342, domesticFilled: 342, commercialFilled: 0, emptyReturned: 342, damagedFound: 0, leakageFound: 0, laborPayment: 1500, remarks: '', staffNames: 'Ramesh Singh, Sunil Kumar' }); }}
                onClose={resetActiveForm}
                onSubmit={() => handleFormSubmit('load')}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Load Reference ID (Gate Pass)*</label>
                    <input 
                      type="text" 
                      required 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none" 
                      placeholder="e.g. LOAD-8921"
                      value={loadForm.loadNumber} 
                      onChange={e => setLoadForm(prev => ({ ...prev, loadNumber: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Arrival Date*</label>
                    <input 
                      type="date" 
                      required 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none" 
                      value={loadForm.arrivalDate} 
                      onChange={e => setLoadForm(prev => ({ ...prev, arrivalDate: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Truck Vehicle Number*</label>
                    <input 
                      type="text" 
                      required 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none" 
                      placeholder="e.g. BR-01GA-8921"
                      value={loadForm.vehicleNumber} 
                      onChange={e => setLoadForm(prev => ({ ...prev, vehicleNumber: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Load Type Pattern*</label>
                    <select 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none bg-white"
                      value={loadForm.pattern} 
                      onChange={e => {
                        const val = e.target.value;
                        if (val === 'DOMESTIC_ONLY') {
                          setLoadForm(prev => ({ ...prev, pattern: val, totalCylinders: 342, domesticFilled: 342, commercialFilled: 0, emptyReturned: 342 }));
                        } else if (val === 'MIXED_COMMERCIAL') {
                          setLoadForm(prev => ({ ...prev, pattern: val, totalCylinders: 324, domesticFilled: 250, commercialFilled: 74, emptyReturned: 324 }));
                        } else {
                          setLoadForm(prev => ({ ...prev, pattern: val }));
                        }
                      }}
                    >
                      <option value="DOMESTIC_ONLY">Domestic Only (342 Cylinders)</option>
                      <option value="MIXED_COMMERCIAL">Mixed Commercial (324 Cylinders)</option>
                      <option value="CUSTOM">Custom Configuration</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Total Cylinders Unloaded*</label>
                    <input 
                      type="number" 
                      required 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none" 
                      value={loadForm.totalCylinders} 
                      onChange={e => setLoadForm(prev => ({ ...prev, totalCylinders: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Domestic Filled Unloaded*</label>
                    <input 
                      type="number" 
                      required 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none" 
                      value={loadForm.domesticFilled} 
                      onChange={e => setLoadForm(prev => ({ ...prev, domesticFilled: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Commercial Filled Unloaded*</label>
                    <input 
                      type="number" 
                      required 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none" 
                      value={loadForm.commercialFilled} 
                      onChange={e => setLoadForm(prev => ({ ...prev, commercialFilled: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Empty Cylinders Returned (Sent back)*</label>
                    <input 
                      type="number" 
                      required 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none" 
                      value={loadForm.emptyReturned} 
                      onChange={e => setLoadForm(prev => ({ ...prev, emptyReturned: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Damaged detected</label>
                    <input 
                      type="number" 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none" 
                      value={loadForm.damagedFound} 
                      onChange={e => setLoadForm(prev => ({ ...prev, damagedFound: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Leakage detected</label>
                    <input 
                      type="number" 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none" 
                      value={loadForm.leakageFound} 
                      onChange={e => setLoadForm(prev => ({ ...prev, leakageFound: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Labor Crew Wage Paid (INR)</label>
                    <input 
                      type="number" 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none" 
                      value={loadForm.laborPayment} 
                      onChange={e => setLoadForm(prev => ({ ...prev, laborPayment: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Labor Staff Names</label>
                    <input 
                      type="text" 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none" 
                      value={loadForm.staffNames} 
                      onChange={e => setLoadForm(prev => ({ ...prev, staffNames: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-xs sm:col-span-2">
                    <label className="font-semibold text-gray-700">Remarks</label>
                    <input 
                      type="text" 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none" 
                      value={loadForm.remarks} 
                      onChange={e => setLoadForm(prev => ({ ...prev, remarks: e.target.value }))}
                    />
                  </div>
                </div>
              </GenericFormShell>
            )}

            {activeForm === 'closing' && isAdmin && (
              <GenericFormShell
                title="7. Daily Closing stock count Form"
                subtitle="Lock end-of-day godown stock counts and audit mismatches"
                instructions={[
                  "Must be locked every evening. Physical stocks are compared with expected database counts.",
                  "Locks inventory update transactions and triggers real-time theft alerts."
                ]}
                isSubmitting={isSubmitting}
                successData={successFormPayload}
                onReset={() => { setSuccessFormPayload(null); setClosingForm({ closingDate: new Date().toISOString().split('T')[0], physical14Filled: 0, physical14Empty: 550, physical19Filled: 0, physical19Empty: 0, physicalDamaged: 0, physicalLeakage: 0, cashInHand: 0, remarks: '' }); }}
                onClose={resetActiveForm}
                onSubmit={() => handleFormSubmit('closing')}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Closing Date*</label>
                    <input 
                      type="date" 
                      required 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none" 
                      value={closingForm.closingDate} 
                      onChange={e => setClosingForm(prev => ({ ...prev, closingDate: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Physical 14.2 kg Domestic Filled*</label>
                    <input 
                      type="number" 
                      min="0" 
                      required 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none" 
                      value={closingForm.physical14Filled} 
                      onChange={e => setClosingForm(prev => ({ ...prev, physical14Filled: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Physical 14.2 kg Domestic Empty*</label>
                    <input 
                      type="number" 
                      min="0" 
                      required 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none" 
                      value={closingForm.physical14Empty} 
                      onChange={e => setClosingForm(prev => ({ ...prev, physical14Empty: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Physical 19 kg Commercial Filled*</label>
                    <input 
                      type="number" 
                      min="0" 
                      required 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none" 
                      value={closingForm.physical19Filled} 
                      onChange={e => setClosingForm(prev => ({ ...prev, physical19Filled: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Physical 19 kg Commercial Empty*</label>
                    <input 
                      type="number" 
                      min="0" 
                      required 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none" 
                      value={closingForm.physical19Empty} 
                      onChange={e => setClosingForm(prev => ({ ...prev, physical19Empty: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Physical Damaged Stock*</label>
                    <input 
                      type="number" 
                      min="0" 
                      required 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none" 
                      value={closingForm.physicalDamaged} 
                      onChange={e => setClosingForm(prev => ({ ...prev, physicalDamaged: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Physical Leakage Stock*</label>
                    <input 
                      type="number" 
                      min="0" 
                      required 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none" 
                      value={closingForm.physicalLeakage} 
                      onChange={e => setClosingForm(prev => ({ ...prev, physicalLeakage: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Physical Cash in Hand (INR)*</label>
                    <input 
                      type="number" 
                      min="0" 
                      required 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none" 
                      value={closingForm.cashInHand} 
                      onChange={e => setClosingForm(prev => ({ ...prev, cashInHand: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-xs sm:col-span-2">
                    <label className="font-semibold text-gray-700">Remarks / Mismatch justifications</label>
                    <input 
                      type="text" 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none" 
                      value={closingForm.remarks} 
                      onChange={e => setClosingForm(prev => ({ ...prev, remarks: e.target.value }))}
                    />
                  </div>
                </div>
              </GenericFormShell>
            )}

            {activeForm === 'incident' && (
              <GenericFormShell
                title="8. Cylinder Incident / Damage Form"
                subtitle="Isolate damaged, valve defect, or leaking cylinders immediately"
                instructions={[
                  "Leakages decrement filled stock and increment leakage stock.",
                  "Damages / defects decrement empty stock and increment damaged stock."
                ]}
                isSubmitting={isSubmitting}
                successData={successFormPayload}
                onReset={() => { setSuccessFormPayload(null); setIncidentForm({ incidentDate: new Date().toISOString().split('T')[0], incidentCategory: 'Cylinder', cylinderType: 'DOMESTIC_14_2', issueType: 'Leakage', quantity: 1, regulatorSerialNumber: '', hosePipeReturned: false, hosePipeQuantity: 0, reportedBy: '', customerId: '', linkExistingCustomer: false, customerName: '', consumerNumber: '', mobileNumber: '', address: '', detectedBy: dbData.employees[0]?.id || '', location: 'godown', remarks: '', photoUrl: '' }); }}
                onClose={resetActiveForm}
                onSubmit={() => handleFormSubmit('incident')}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Date */}
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Incident Date*</label>
                    <input 
                      type="date" 
                      required 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none" 
                      value={incidentForm.incidentDate} 
                      onChange={e => setIncidentForm(prev => ({ ...prev, incidentDate: e.target.value }))}
                    />
                  </div>

                  {/* Category */}
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Incident Category*</label>
                    <select 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none bg-white"
                      value={incidentForm.incidentCategory} 
                      onChange={e => setIncidentForm(prev => ({ ...prev, incidentCategory: e.target.value }))}
                    >
                      <option value="Cylinder">Cylinder Issue</option>
                      <option value="Regulator">Regulator Defect / Return</option>
                      <option value="Hose Pipe">Hose Pipe Issue</option>
                      <option value="Delivery">Delivery Incident</option>
                      <option value="Customer Complaint">Customer Complaint</option>
                      <option value="Other">Other / Miscellaneous</option>
                    </select>
                  </div>

                  {/* Cylinder Type (only if category is Cylinder) */}
                  {incidentForm.incidentCategory === 'Cylinder' && (
                    <div className="flex flex-col gap-1 text-xs">
                      <label className="font-semibold text-gray-700">Cylinder Type*</label>
                      <select 
                        className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none bg-white"
                        value={incidentForm.cylinderType} 
                        onChange={e => setIncidentForm(prev => ({ ...prev, cylinderType: e.target.value }))}
                      >
                        <option value="DOMESTIC_14_2">Domestic (14.2 kg)</option>
                        <option value="COMMERCIAL_19">Commercial (19 kg)</option>
                        <option value="NA">Not Applicable (NA)</option>
                      </select>
                    </div>
                  )}

                  {/* Issue / Defect Type */}
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Issue / Defect Type*</label>
                    <select 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none bg-white"
                      value={incidentForm.issueType} 
                      onChange={e => setIncidentForm(prev => ({ ...prev, issueType: e.target.value }))}
                    >
                      <option value="Leakage">Gas Leakage</option>
                      <option value="Damage">Physical Body Damage</option>
                      <option value="Valve Issue">Defective Valve</option>
                      <option value="Regulator Defect">Regulator Malfunction</option>
                      <option value="Hose Pipe Return">Hose Pipe Replacement/Return</option>
                      <option value="Seal Issue">Seal Broken / Weight Shortage</option>
                      <option value="Other">Other Observation</option>
                    </select>
                  </div>

                  {/* Quantity */}
                  {['Cylinder', 'Regulator', 'Hose Pipe'].includes(incidentForm.incidentCategory) && (
                    <div className="flex flex-col gap-1 text-xs">
                      <label className="font-semibold text-gray-700">Quantity Affected*</label>
                      <input 
                        type="number" 
                        min="1" 
                        required 
                        className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none" 
                        value={incidentForm.quantity} 
                        onChange={e => setIncidentForm(prev => ({ ...prev, quantity: e.target.value }))}
                      />
                    </div>
                  )}

                  {/* Regulator Serial Number (only if Regulator category) */}
                  {incidentForm.incidentCategory === 'Regulator' && (
                    <div className="flex flex-col gap-1 text-xs">
                      <label className="font-semibold text-gray-700">Regulator Serial Number (Free Text)*</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. REG-89201"
                        className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none" 
                        value={incidentForm.regulatorSerialNumber} 
                        onChange={e => setIncidentForm(prev => ({ ...prev, regulatorSerialNumber: e.target.value }))}
                      />
                    </div>
                  )}

                  {/* Hose Pipe Returned (only if Hose Pipe category) */}
                  {incidentForm.incidentCategory === 'Hose Pipe' && (
                    <>
                      <div className="flex items-center gap-2 mt-4 text-xs">
                        <input 
                          type="checkbox" 
                          id="hosePipeReturned"
                          className="w-4 h-4 rounded border-gray-300"
                          checked={incidentForm.hosePipeReturned} 
                          onChange={e => setIncidentForm(prev => ({ ...prev, hosePipeReturned: e.target.checked }))}
                        />
                        <label htmlFor="hosePipeReturned" className="font-semibold text-gray-700 cursor-pointer">
                          Hose Pipe Returned to Stock
                        </label>
                      </div>
                      {incidentForm.hosePipeReturned && (
                        <div className="flex flex-col gap-1 text-xs">
                          <label className="font-semibold text-gray-700">Hose Pipe Quantity Returned*</label>
                          <input 
                            type="number" 
                            min="1"
                            required
                            className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none" 
                            value={incidentForm.hosePipeQuantity} 
                            onChange={e => setIncidentForm(prev => ({ ...prev, hosePipeQuantity: e.target.value }))}
                          />
                        </div>
                      )}
                    </>
                  )}

                  {/* Reported By */}
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Reported By (Person)*</label>
                    <input 
                      type="text" 
                      required 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none" 
                      placeholder="e.g. Employee or Customer name"
                      value={incidentForm.reportedBy} 
                      onChange={e => setIncidentForm(prev => ({ ...prev, reportedBy: e.target.value }))}
                    />
                  </div>

                  {/* Detected By Staff Link */}
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Detected By Staff Link*</label>
                    <select 
                      required
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none bg-white"
                      value={incidentForm.detectedBy} 
                      onChange={e => setIncidentForm(prev => ({ ...prev, detectedBy: e.target.value }))}
                    >
                      <option value="">-- Choose Staff --</option>
                      {dbData.employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                      ))}
                    </select>
                  </div>

                  {renderCustomerSection('incident', incidentForm, setIncidentForm)}

                  {/* Location */}
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Incident Location*</label>
                    <input 
                      type="text" 
                      required 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none" 
                      placeholder="e.g. Godown Shelf A, or delivery truck"
                      value={incidentForm.location} 
                      onChange={e => setIncidentForm(prev => ({ ...prev, location: e.target.value }))}
                    />
                  </div>

                  {/* Photo upload optional */}
                  <div className="flex flex-col gap-1 text-xs sm:col-span-2">
                    <label className="font-semibold text-gray-700">Attach Incident Photo (Optional)</label>
                    <input 
                      type="file" 
                      accept="image/*"
                      className="border border-[#E8EAF0] rounded p-1.5 text-xs outline-none bg-gray-50 cursor-pointer"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setIncidentForm(prev => ({ ...prev, photoUrl: reader.result }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    {incidentForm.photoUrl && (
                      <img src={incidentForm.photoUrl} alt="Preview" className="w-full h-32 object-cover rounded-lg border border-[#E8EAF0] mt-2 animate-fade-in" />
                    )}
                  </div>

                  {/* Remarks */}
                  <div className="flex flex-col gap-1 text-xs sm:col-span-2">
                    <label className="font-semibold text-gray-700">Remarks / Operational Details</label>
                    <textarea 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none h-16"
                      value={incidentForm.remarks} 
                      onChange={e => setIncidentForm(prev => ({ ...prev, remarks: e.target.value }))}
                    />
                  </div>
                </div>
              </GenericFormShell>
            )}

            {activeForm === 'expense' && isAdmin && (
              <GenericFormShell
                title="9. Expense Entry Form"
                subtitle="Record warehouse expenses, rent, or staff wage payments"
                instructions={[
                  "Wages paid here reconcile daily closing balances.",
                  "Restricted to Admin/Manager accounts."
                ]}
                isSubmitting={isSubmitting}
                successData={successFormPayload}
                onReset={() => { setSuccessFormPayload(null); setExpenseForm({ expenseDate: new Date().toISOString().split('T')[0], category: 'diesel', amount: 0, paidTo: '', paymentMode: 'CASH', remarks: '' }); }}
                onClose={resetActiveForm}
                onSubmit={() => handleFormSubmit('expense')}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Expense Date*</label>
                    <input 
                      type="date" 
                      required 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none" 
                      value={expenseForm.expenseDate} 
                      onChange={e => setExpenseForm(prev => ({ ...prev, expenseDate: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Expense Category*</label>
                    <select 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none bg-white"
                      value={expenseForm.category} 
                      onChange={e => setExpenseForm(prev => ({ ...prev, category: e.target.value }))}
                    >
                      <option value="diesel">Diesel for delivery truck</option>
                      <option value="labor_wage">Labor/Staff wages</option>
                      <option value="rent">Godown rent</option>
                      <option value="electric">Electricity/Water utilities</option>
                      <option value="printing">Stationery & Book Printing</option>
                      <option value="other">Miscellaneous expenses</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Expense Amount (INR)*</label>
                    <input 
                      type="number" 
                      min="1" 
                      required 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none" 
                      value={expenseForm.amount} 
                      onChange={e => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Paid To (Vendor Name)*</label>
                    <input 
                      type="text" 
                      required 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none" 
                      placeholder="e.g. IndianOil fuel depot"
                      value={expenseForm.paidTo} 
                      onChange={e => setExpenseForm(prev => ({ ...prev, paidTo: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Payment Mode*</label>
                    <select 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none bg-white"
                      value={expenseForm.paymentMode} 
                      onChange={e => setExpenseForm(prev => ({ ...prev, paymentMode: e.target.value }))}
                    >
                      <option value="CASH">Cash in Hand</option>
                      <option value="UPI">UPI/Online Payment</option>
                      <option value="BANK_TRANSFER">Bank Direct Transfer</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1 text-xs sm:col-span-2">
                    <label className="font-semibold text-gray-700">Remarks / Bill Reference</label>
                    <input 
                      type="text" 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none" 
                      value={expenseForm.remarks} 
                      onChange={e => setExpenseForm(prev => ({ ...prev, remarks: e.target.value }))}
                    />
                  </div>
                </div>
              </GenericFormShell>
            )}

            {activeForm === 'payment' && (
              <GenericFormShell
                title="10. Customer Payment Entry Form"
                subtitle="Log payments received from credit/commercial customers"
                instructions={[
                  "Decrements the customer's outstanding commercial credit balance.",
                  "If logged by staff, requires Admin approval before credit reduces."
                ]}
                isSubmitting={isSubmitting}
                successData={successFormPayload}
                onReset={() => { setSuccessFormPayload(null); setPaymentForm({ customerId: '', linkExistingCustomer: false, customerName: '', consumerNumber: '', mobileNumber: '', address: '', amount: 0, paymentDate: new Date().toISOString().split('T')[0], paymentMode: 'CASH', remarks: '' }); }}
                onClose={resetActiveForm}
                onSubmit={() => handleFormSubmit('payment')}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Payment Date*</label>
                    <input 
                      type="date" 
                      required 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none" 
                      value={paymentForm.paymentDate} 
                      onChange={e => setPaymentForm(prev => ({ ...prev, paymentDate: e.target.value }))}
                    />
                  </div>
                  {renderCustomerSection('payment', paymentForm, setPaymentForm)}
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Amount Received (INR)*</label>
                    <input 
                      type="number" 
                      min="1" 
                      required 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none" 
                      value={paymentForm.amount} 
                      onChange={e => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Payment Mode*</label>
                    <select 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none bg-white"
                      value={paymentForm.paymentMode} 
                      onChange={e => setPaymentForm(prev => ({ ...prev, paymentMode: e.target.value }))}
                    >
                      <option value="CASH">Cash in Hand</option>
                      <option value="UPI">UPI/Online Payment</option>
                      <option value="BANK_TRANSFER">Bank direct transfer</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1 text-xs sm:col-span-2">
                    <label className="font-semibold text-gray-700">Payment remarks / slip transaction ID</label>
                    <input 
                      type="text" 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none" 
                      value={paymentForm.remarks} 
                      onChange={e => setPaymentForm(prev => ({ ...prev, remarks: e.target.value }))}
                    />
                  </div>
                </div>
              </GenericFormShell>
            )}

            {activeForm === 'invoice' && isAdmin && (
              <GenericFormShell
                title="11. Custom Invoice Creation Form"
                subtitle="Issue a commercial cylinder invoice"
                instructions={[
                  "Standard invoice format for wholesale dispatches.",
                  "Saves in the main billing dashboard with unique invoice numbers."
                ]}
                isSubmitting={isSubmitting}
                successData={successFormPayload}
                onReset={() => { setSuccessFormPayload(null); setInvoiceForm({ customerId: '', linkExistingCustomer: false, customerName: '', consumerNumber: '', mobileNumber: '', address: '', cylinderType: 'DOMESTIC_14_2', quantity: 1, rate: 950, paidAmount: 950, paymentStatus: 'paid' }); }}
                onClose={resetActiveForm}
                onSubmit={() => handleFormSubmit('invoice')}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {renderCustomerSection('invoice', invoiceForm, setInvoiceForm)}
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Item Description (Cylinder Type)*</label>
                    <input 
                      type="text" 
                      required 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none" 
                      placeholder="e.g. 19 kg Commercial Refill"
                      value={invoiceForm.cylinderType} 
                      onChange={e => setInvoiceForm(prev => ({ ...prev, cylinderType: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Quantity*</label>
                    <input 
                      type="number" 
                      min="1" 
                      required 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none" 
                      value={invoiceForm.quantity} 
                      onChange={e => setInvoiceForm(prev => ({ ...prev, quantity: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Rate per Unit (INR)*</label>
                    <input 
                      type="number" 
                      min="1" 
                      required 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none" 
                      value={invoiceForm.rate} 
                      onChange={e => setInvoiceForm(prev => ({ ...prev, rate: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Amount Paid (INR)*</label>
                    <input 
                      type="number" 
                      min="0" 
                      required 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none" 
                      value={invoiceForm.paidAmount} 
                      onChange={e => setInvoiceForm(prev => ({ ...prev, paidAmount: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Payment Status*</label>
                    <select 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none bg-white"
                      value={invoiceForm.paymentStatus} 
                      onChange={e => setInvoiceForm(prev => ({ ...prev, paymentStatus: e.target.value }))}
                    >
                      <option value="paid">Fully Paid</option>
                      <option value="pending">Credit Outstanding</option>
                    </select>
                  </div>
                </div>
              </GenericFormShell>
            )}

            {activeForm === 'stock_adjustment' && isAdmin && (
              <GenericFormShell
                title="12. Stock Adjustment Form"
                subtitle="Tune warehouse stock balances directly with audit trails"
                instructions={[
                  "Warning: This action directly updates database stock without operational sales.",
                  "Requires a valid reason which is logged forever in the audit logs."
                ]}
                isSubmitting={isSubmitting}
                successData={successFormPayload}
                onReset={() => { setSuccessFormPayload(null); setStockAdjustmentForm({ cylinderType: 'DOMESTIC_14_2', filledChange: 0, emptyChange: 0, damagedChange: 0, leakageChange: 0, remarks: '' }); }}
                onClose={resetActiveForm}
                onSubmit={() => handleFormSubmit('stock_adjustment')}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Cylinder Stock Type*</label>
                    <select 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none bg-white"
                      value={stockAdjustmentForm.cylinderType} 
                      onChange={e => setStockAdjustmentForm(prev => ({ ...prev, cylinderType: e.target.value }))}
                    >
                      <option value="DOMESTIC_14_2">Domestic (14.2 kg)</option>
                      <option value="COMMERCIAL_19">Commercial (19 kg)</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Filled Stock Change (Negative to decrease)</label>
                    <input 
                      type="number" 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none" 
                      value={stockAdjustmentForm.filledChange} 
                      onChange={e => setStockAdjustmentForm(prev => ({ ...prev, filledChange: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Empty Stock Change (Negative to decrease)</label>
                    <input 
                      type="number" 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none" 
                      value={stockAdjustmentForm.emptyChange} 
                      onChange={e => setStockAdjustmentForm(prev => ({ ...prev, emptyChange: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Damaged Stock Change</label>
                    <input 
                      type="number" 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none" 
                      value={stockAdjustmentForm.damagedChange} 
                      onChange={e => setStockAdjustmentForm(prev => ({ ...prev, damagedChange: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-xs">
                    <label className="font-semibold text-gray-700">Leakage Stock Change</label>
                    <input 
                      type="number" 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none" 
                      value={stockAdjustmentForm.leakageChange} 
                      onChange={e => setStockAdjustmentForm(prev => ({ ...prev, leakageChange: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-xs sm:col-span-2">
                    <label className="font-semibold text-gray-700">Reason for Stock Adjustment (Required)*</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. Bottling plant reconciliation difference"
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none" 
                      value={stockAdjustmentForm.remarks} 
                      onChange={e => setStockAdjustmentForm(prev => ({ ...prev, remarks: e.target.value }))}
                    />
                  </div>
                </div>
              </GenericFormShell>
            )}
          </div>
        ) : (
          /* ------------------- MAIN TAB RENDERINGS ------------------- */
          <div>
            {activeTab === 'dashboard' && (
              <div>
                <div className="page-header mb-6">
                  <div className="page-title">
                    <h1 className="text-2xl font-bold text-[#02164F]">LPG Operations Command Center</h1>
                    <p className="text-sm text-gray-500">Maa Santoshi Indane Gramin Vitrak — Stock ledger & role audits</p>
                  </div>
                </div>

                {/* ========================================================================= */}
                {/* ADMIN / MANAGER DASHBOARD VIEW */}
                {/* ========================================================================= */}
                {isAdmin && (
                  <div>
                    {/* Stock Mismatch Alarm */}
                    {dbData.dailyClosings?.[0] && (
                      (dbData.dailyClosings[0].mismatch14Filled !== 0 || 
                       dbData.dailyClosings[0].mismatch14Empty !== 0) && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 items-center mb-6 text-red-800 text-sm">
                          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 animate-bounce" />
                          <div>
                            <strong>EOD Stock Mismatch Detected:</strong> Physical closing counts ({new Date(dbData.dailyClosings[0].closingDate).toLocaleDateString()}) mismatch with Expected ledger balances!
                            <span className="ml-1 text-xs text-red-600 block">Domestic Filled Mismatch: {dbData.dailyClosings[0].mismatch14Filled} | Domestic Empty Mismatch: {dbData.dailyClosings[0].mismatch14Empty}</span>
                          </div>
                        </div>
                      )
                    )}

                    {/* Storage Capacity Guardrail */}
                    <div className="bg-white border border-[#E8EAF0] rounded-xl p-4 mb-6 shadow-sm">
                      <div className="flex justify-between items-center text-xs font-bold text-[#02164F] mb-1.5">
                        <span>Godown Storage Capacity Density (6,000 kg Limit)</span>
                        <span>{dbData.kpis?.totalLpgWeight?.toLocaleString() || 0} kg stored / 6,000 kg</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            dbData.kpis?.totalLpgWeight > 5500 ? 'bg-red-600' : (dbData.kpis?.totalLpgWeight > 4500 ? 'bg-yellow-500' : 'bg-[#02164F]')
                          }`} 
                          style={{ width: `${Math.min(100, ((dbData.kpis?.totalLpgWeight || 0) / 6000) * 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Active Load Cycle Banner */}
                    {dbData.activeLoadCycle && (
                      <div className="bg-orange-50 border border-[#F37022]/20 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-[#F37022]/10 rounded-lg text-[#F37022]">
                            <Database className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-[#02164F]">Active Load Cycle: #{dbData.activeLoadCycle.loadNumber}</h4>
                              <span className="bg-[#F37022]/10 text-[#F37022] text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize">
                                {dbData.activeLoadCycle.loadType.toLowerCase()} Load
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Started: {new Date(dbData.activeLoadCycle.loadDate).toLocaleString()} | Cylinders Received: {dbData.activeLoadCycle.cylindersReceived}
                            </p>
                            <div className="flex gap-4 mt-2 text-xs text-gray-600 font-medium">
                              <span>Deliveries Completed: <strong className="text-[#02164F]">{dbData.activeLoadCycle.deliveriesCompleted || 0}</strong></span>
                              <span>Empty Returns Logged: <strong className="text-[#02164F]">{dbData.activeLoadCycle.emptyReturns || 0}</strong></span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <button
                            type="button"
                            onClick={() => {
                              setCloseMismatchCount(0);
                              setShowCloseCycleModal(true);
                            }}
                            className="w-full md:w-auto px-4 py-2 bg-[#F37022] text-white text-xs font-semibold rounded-xl hover:bg-[#F37022]/90 transition active:scale-95 shadow-sm"
                          >
                            Close Load Cycle
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Cylinder Stock Registry */}
                    <div className="mb-6 animate-fade-in">
                      <h3 className="text-xs font-bold text-[#02164F] uppercase tracking-wider mb-3">Cylinder Stock Registry</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* 1. 14.2 filled */}
                        <div className="bg-white border border-[#E8EAF0] rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                          <div className="flex justify-between items-start">
                            <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">14.2 kg Filled Stock</span>
                            <span className="px-2 py-0.5 rounded text-[8px] font-bold text-white uppercase" style={{ background: stockThresholdColor }}>
                              {stockThreshold}
                            </span>
                          </div>
                          <div className="text-2xl font-bold text-[#02164F] mt-2">
                            {dbData.inventory?.domestic?.filledStock || 0} <span className="text-xs text-gray-400 font-normal">Cyl</span>
                          </div>
                          <span className="text-[10px] text-gray-400 mt-1">Filled domestic cylinders</span>
                        </div>

                        {/* 2. 14.2 empty */}
                        <div className="bg-white border border-[#E8EAF0] rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                          <div className="flex justify-between items-start">
                            <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">14.2 kg Empty Stock</span>
                            <span className="text-gray-400"><TrendingUp className="w-3.5 h-3.5" /></span>
                          </div>
                          <div className="text-2xl font-bold text-[#02164F] mt-2">
                            {dbData.inventory?.domestic?.emptyStock || 0} <span className="text-xs text-gray-400 font-normal">Cyl</span>
                          </div>
                          <span className="text-[10px] text-gray-400 mt-1">Empty domestic cylinders</span>
                        </div>

                        {/* 3. 19 filled */}
                        <div className="bg-white border border-[#E8EAF0] rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                          <div className="flex justify-between items-start">
                            <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">19 kg Filled Stock</span>
                            <span className="text-blue-600 bg-blue-50 p-0.5 rounded"><TrendingUp className="w-3.5 h-3.5" /></span>
                          </div>
                          <div className="text-2xl font-bold text-[#02164F] mt-2">
                            {dbData.inventory?.commercial?.filledStock || 0} <span className="text-xs text-gray-400 font-normal">Cyl</span>
                          </div>
                          <span className="text-[10px] text-gray-400 mt-1">Filled commercial cylinders</span>
                        </div>

                        {/* 4. 19 empty */}
                        <div className="bg-white border border-[#E8EAF0] rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                          <div className="flex justify-between items-start">
                            <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">19 kg Empty Stock</span>
                            <span className="text-gray-400"><TrendingUp className="w-3.5 h-3.5" /></span>
                          </div>
                          <div className="text-2xl font-bold text-[#02164F] mt-2">
                            {dbData.inventory?.commercial?.emptyStock || 0} <span className="text-xs text-gray-400 font-normal">Cyl</span>
                          </div>
                          <span className="text-[10px] text-gray-400 mt-1">Empty commercial cylinders</span>
                        </div>
                      </div>
                    </div>

                    {/* Today's Operations Summary */}
                    <div className="mb-6 animate-fade-in">
                      <h3 className="text-xs font-bold text-[#02164F] uppercase tracking-wider mb-3">Today's Operations Summary</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* 5. Today's Deliveries */}
                        <div className="bg-white border border-[#E8EAF0] rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                          <div className="flex justify-between items-start">
                            <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Today's Deliveries</span>
                            <span className="text-[#F37022] bg-[#F37022]/10 p-0.5 rounded"><Truck className="w-3.5 h-3.5" /></span>
                          </div>
                          <div className="text-2xl font-bold text-[#02164F] mt-2">
                            {dbData.kpis?.todayDeliveriesCount || 0}
                          </div>
                          <span className="text-[10px] text-gray-400 mt-1">Refill dispatches today</span>
                        </div>

                        {/* 6. Cash Collected */}
                        <div className="bg-white border border-[#E8EAF0] rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                          <div className="flex justify-between items-start">
                            <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Cash Collected</span>
                            <span className="text-green-600 bg-green-50 p-0.5 rounded"><DollarSign className="w-3.5 h-3.5" /></span>
                          </div>
                          <div className="text-2xl font-bold text-green-700 mt-2">
                            ₹{dbData.kpis?.todayCashCollection?.toLocaleString() || 0}
                          </div>
                          <span className="text-[10px] text-gray-400 mt-1">Today's cash receipts</span>
                        </div>

                        {/* 7. Commercial Pending */}
                        <div className="bg-white border border-[#E8EAF0] rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                          <div className="flex justify-between items-start">
                            <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Commercial Pending</span>
                            <span className="text-yellow-600 bg-yellow-50 p-0.5 rounded"><AlertTriangle className="w-3.5 h-3.5" /></span>
                          </div>
                          <div className="text-2xl font-bold text-yellow-600 mt-2">
                            ₹{dbData.kpis?.pendingCommercialAmount?.toLocaleString() || 0}
                          </div>
                          <span className="text-[10px] text-gray-400 mt-1">Pending: {dbData.kpis?.pendingCommercialEmpties || 0} empties</span>
                        </div>

                        {/* 8. Security Alerts */}
                        <div className="bg-white border border-[#E8EAF0] rounded-2xl p-4 shadow-sm flex flex-col justify-between border-l-red-500 border-l-2">
                          <div className="flex justify-between items-start">
                            <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Security Alerts</span>
                            <span className="text-red-600 bg-red-50 p-0.5 rounded"><ShieldAlert className="w-3.5 h-3.5" /></span>
                          </div>
                          <div className="text-2xl font-bold text-red-600 mt-2">
                            {dbData.kpis?.problemCylinders || 0}
                          </div>
                          <span className="text-[10px] text-gray-400 mt-1">Damaged / leaking stock</span>
                        </div>
                      </div>
                    </div>

                    {/* Ancillary Services & Returns */}
                    <div className="mb-6 animate-fade-in">
                      <h3 className="text-xs font-bold text-[#02164F] uppercase tracking-wider mb-3">Ancillary Services & Returns</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* 9. eKYC Count Today */}
                        <div className="bg-white border border-[#E8EAF0] rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                          <div className="flex justify-between items-start">
                            <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">eKYC Done Today</span>
                            <span className="text-blue-600 bg-blue-50 p-0.5 rounded"><CheckCircle className="w-3.5 h-3.5" /></span>
                          </div>
                          <div className="text-2xl font-bold text-[#02164F] mt-2">
                            {dbData.kpis?.eKycCountToday || 0}
                          </div>
                          <span className="text-[10px] text-gray-400 mt-1">Verifications completed</span>
                        </div>

                        {/* 10. LPG Card Book Count */}
                        <div className="bg-white border border-[#E8EAF0] rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                          <div className="flex justify-between items-start">
                            <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">LPG Card Books Issued</span>
                            <span className="text-orange-600 bg-orange-50 p-0.5 rounded"><FileText className="w-3.5 h-3.5" /></span>
                          </div>
                          <div className="text-2xl font-bold text-[#02164F] mt-2">
                            {dbData.kpis?.lpgCardBookCountToday || 0}
                          </div>
                          <span className="text-[10px] text-gray-400 mt-1">Card books issued today</span>
                        </div>

                        {/* 11. Regulator Returns */}
                        <div className="bg-white border border-[#E8EAF0] rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                          <div className="flex justify-between items-start">
                            <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Regulator Returns</span>
                            <span className="text-gray-600 bg-gray-50 p-0.5 rounded"><RefreshCw className="w-3.5 h-3.5" /></span>
                          </div>
                          <div className="text-2xl font-bold text-[#02164F] mt-2">
                            {dbData.kpis?.regulatorReturnsCount || 0}
                          </div>
                          <span className="text-[10px] text-gray-400 mt-1">Total returned units</span>
                        </div>

                        {/* 12. Hose Pipe Returns */}
                        <div className="bg-white border border-[#E8EAF0] rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                          <div className="flex justify-between items-start">
                            <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Hose Pipe Returns</span>
                            <span className="text-gray-600 bg-gray-50 p-0.5 rounded"><RefreshCw className="w-3.5 h-3.5" /></span>
                          </div>
                          <div className="text-2xl font-bold text-[#02164F] mt-2">
                            {dbData.kpis?.hosePipeReturnsCount || 0}
                          </div>
                          <span className="text-[10px] text-gray-400 mt-1">Returned units today</span>
                        </div>
                      </div>
                    </div>

                    {/* Stock Movement Line Chart & Employee Verification Queue */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                      {/* Chart spans 2 columns */}
                      <div className="bg-white border border-[#E8EAF0] rounded-xl p-5 shadow-sm lg:col-span-2 flex flex-col justify-between min-h-[340px]">
                        <div className="mb-4">
                          <h3 className="text-sm font-bold text-[#02164F]">Stock Movement (Last 7 Days)</h3>
                          <p className="text-[11px] text-gray-400 mt-0.5">Physical inventory counts from daily EOD closings</p>
                        </div>
                        {chartData && chartData.length > 0 ? (
                          <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                <XAxis dataKey="date" tickLine={false} axisLine={false} style={{ fontSize: 10, fill: '#94A3B8' }} />
                                <YAxis tickLine={false} axisLine={false} style={{ fontSize: 10, fill: '#94A3B8' }} />
                                <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: 11 }} />
                                <Line type="monotone" dataKey="14.2 kg Filled" stroke="#02164F" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                                <Line type="monotone" dataKey="19 kg Filled" stroke="#F37022" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                                <Line type="monotone" dataKey="Empty Stock" stroke="#94A3B8" strokeWidth={2} dot={{ r: 2 }} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        ) : (
                          <div className="h-64 flex flex-col items-center justify-center border border-dashed border-gray-100 rounded-xl bg-gray-50/50 text-center p-4">
                            <TrendingUp className="w-8 h-8 text-gray-300 mb-2" />
                            <p className="text-xs text-gray-500 font-medium">No stock movement data available yet</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">Please submit a Daily Closing Stock count to start tracking history.</p>
                          </div>
                        )}
                      </div>

                      {/* Verification Queue spans 1 column */}
                      <div className="bg-white border border-[#E8EAF0] rounded-xl p-5 shadow-sm lg:col-span-1 flex flex-col justify-between min-h-[340px]">
                        <div>
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-bold text-[#02164F] flex items-center gap-2">
                              <ClipboardCheck className="w-4 h-4 text-[#F37022]" />
                              <span>Employee Verification Queue</span>
                            </h3>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F59E0B]/10 text-[#F59E0B]">
                              {dbData.verificationQueue?.length || 0} Pending
                            </span>
                          </div>

                          <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                            {dbData.verificationQueue?.map(item => (
                              <div key={item.id} className="border border-gray-100 rounded-xl p-3 bg-gray-50 hover:bg-white hover:border-[#E8EAF0] transition flex flex-col justify-between gap-2.5 text-xs">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <span className="inline-block px-1.5 py-0.5 rounded bg-gray-200 text-[8px] font-bold uppercase tracking-wider mb-1">
                                      {item.type}
                                    </span>
                                    <h4 className="font-bold text-gray-800 text-[11px]">
                                      {item.customer?.name || "Refinery / Incidents"}
                                    </h4>
                                  </div>
                                  <span className="text-gray-400 font-mono text-[9px]">
                                    {new Date(item.createdAt).toLocaleDateString()}
                                  </span>
                                </div>

                                <div className="border-t border-gray-200/50 pt-1.5 grid grid-cols-2 gap-1 text-[10px] text-gray-500">
                                  {item.type === 'DELIVERY' && (
                                    <>
                                      <span>Qty: {item.deliveryItems?.[0]?.quantityDelivered} unit</span>
                                      <span>Paid: ₹{item.amountReceived}</span>
                                    </>
                                  )}
                                  {item.type === 'CONNECTION' && (
                                    <>
                                      <span>Type: {item.connectionType === 'SINGLE_BOTTLE' ? 'SBC' : 'DBC'}</span>
                                      <span>Paid: ₹{item.amountPaid}</span>
                                    </>
                                  )}
                                  {item.type === 'EMPTY_RETURN' && (
                                    <>
                                      <span>Qty: {item.quantity} unit</span>
                                      <span>Type: {item.cylinderType === 'DOMESTIC_14_2' ? '14.2kg' : '19kg'}</span>
                                    </>
                                  )}
                                  {item.type === 'PAYMENT' && (
                                    <>
                                      <span>Amt: ₹{item.amount}</span>
                                      <span>Mode: {item.paymentMode}</span>
                                    </>
                                  )}
                                  {item.type === 'INCIDENT' && (
                                    <>
                                      <span>Cat: {item.incidentCategory}</span>
                                      <span>Qty: {item.quantity} unit</span>
                                    </>
                                  )}
                                </div>

                                <div className="border-t border-gray-200/50 pt-1.5 flex justify-end gap-1.5">
                                  <button 
                                    onClick={() => handleRejectEntry(item)}
                                    className="px-2 py-0.5 border border-red-200 text-red-600 rounded text-[9px] font-bold hover:bg-red-50 transition"
                                  >
                                    Reject
                                  </button>
                                  <button 
                                    onClick={() => handleApproveEntry(item)}
                                    className="px-2 py-0.5 bg-[#02164F] text-white rounded text-[9px] font-bold hover:bg-[#02164F]/90 transition"
                                  >
                                    Review
                                  </button>
                                </div>
                              </div>
                            ))}

                            {(!dbData.verificationQueue || dbData.verificationQueue.length === 0) && (
                              <div className="text-center text-gray-400 py-12 text-xs">
                                No pending verification items in the queue.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Recent table (Full Width) */}
                    <div className="bg-white border border-[#E8EAF0] rounded-xl p-5 shadow-sm mb-6 w-full">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-bold text-[#02164F]">Recent Delivery Transactions</h3>
                        <button 
                          onClick={() => triggerPrintJob('account_ledger', {})} 
                          className="px-2.5 py-1 bg-white border border-[#E8EAF0] text-gray-700 hover:bg-gray-50 text-[10px] rounded font-bold transition flex items-center gap-1"
                        >
                          <Printer className="w-3 h-3" /> Print Ledger Report
                        </button>
                      </div>
                      
                      <div className="overflow-x-auto w-full">
                        <table className="w-full text-xs text-left border-collapse min-w-[700px]">
                          <thead>
                            <tr className="border-b border-[#E8EAF0] text-gray-500 font-bold bg-gray-50/50">
                              <th className="p-3">Date</th>
                              <th className="p-3">Customer</th>
                              <th className="p-3">Staff</th>
                              <th className="p-3">Cylinder Details</th>
                              <th className="p-3">DAC Code</th>
                              <th className="p-3">Total Amount</th>
                              <th className="p-3">Status</th>
                              <th className="p-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {filteredDeliveries.map(del => {
                              const cust = dbData.customers?.find(c => c.id === del.customerId) || { name: 'Direct/Walk-in' };
                              const emp = dbData.employees?.find(e => e.id === del.employeeId) || { name: 'N/A' };
                              const item = del.deliveryItems?.[0] || { quantityDelivered: 0, cylinderType: 'DOMESTIC_14_2', dacCode: '', ratePerCylinder: 0 };
                              const statusColor = del.verificationStatus === 'APPROVED' 
                                ? 'bg-green-100 text-green-700' 
                                : (del.verificationStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700');
                              return (
                                <tr key={del.id} className="hover:bg-gray-50/50">
                                  <td className="p-3 font-medium">{new Date(del.deliveryDate).toLocaleDateString()}</td>
                                  <td className="p-3 font-semibold text-gray-800">{del.customerName || cust.name}</td>
                                  <td className="p-3">{emp.name}</td>
                                  <td className="p-3">{item.quantityDelivered} unit ({item.cylinderType === 'DOMESTIC_14_2' ? '14.2 kg' : '19 kg'})</td>
                                  <td className="p-3 font-mono font-bold text-gray-700">{item.dacCode || 'N/A'}</td>
                                  <td className="p-3 font-semibold">₹{del.totalAmount}</td>
                                  <td className="p-3">
                                    <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${statusColor}`}>
                                      {del.verificationStatus}
                                    </span>
                                  </td>
                                  <td className="p-3 text-right">
                                    <button 
                                      onClick={() => triggerPrintJob('invoice', {
                                        invoiceNumber: `INV-${del.id.slice(-6).toUpperCase()}`,
                                        invoiceDate: del.deliveryDate,
                                        customerName: cust.name,
                                        quantity: item.quantityDelivered,
                                        rate: item.ratePerCylinder,
                                        totalAmount: del.totalAmount,
                                        paidAmount: del.amountReceived,
                                        balanceAmount: del.amountPending,
                                        paymentStatus: del.paymentStatus
                                      })}
                                      className="p-1 text-[#02164F] hover:bg-gray-100 rounded transition"
                                      title="Print Receipt"
                                    >
                                      <Printer className="w-4 h-4 inline" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                            {filteredDeliveries.length === 0 && (
                              <tr>
                                <td colSpan="8" className="text-center text-gray-400 py-8">No delivery records found.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* EMPLOYEE DASHBOARD VIEW */}
                {/* ========================================================================= */}
                {isEmployee && (
                  <div className="space-y-6 animate-fade-in">
                    {/* Action Cards */}
                    <div className="bg-white border border-[#E8EAF0] rounded-xl p-5 shadow-sm">
                      <h3 className="text-sm font-bold text-[#02164F] mb-4">LPG Ledger Input Actions</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <button 
                          onClick={() => setActiveForm('domestic')}
                          className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 hover:border-[#F37022] hover:bg-gray-50 transition text-center"
                        >
                          <Receipt className="w-6 h-6 text-[#F37022]" />
                          <span className="text-xs font-semibold text-gray-800 font-medium">Add Domestic Sale</span>
                        </button>
                        <button 
                          onClick={() => setActiveForm('commercial')}
                          className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 hover:border-[#02164F] hover:bg-gray-50 transition text-center"
                        >
                          <Receipt className="w-6 h-6 text-[#02164F]" />
                          <span className="text-xs font-semibold text-gray-800 font-medium">Add Commercial Sale</span>
                        </button>
                        <button 
                          onClick={() => setActiveForm('connection')}
                          className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 hover:border-blue-600 hover:bg-gray-50 transition text-center"
                        >
                          <UserPlus className="w-6 h-6 text-blue-600" />
                          <span className="text-xs font-semibold text-gray-800 font-medium">New Connection SBC/DBC</span>
                        </button>
                        <button 
                          onClick={() => setActiveForm('empty_return')}
                          className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 hover:border-orange-500 hover:bg-gray-50 transition text-center"
                        >
                          <Truck className="w-6 h-6 text-orange-500" />
                          <span className="text-xs font-semibold text-gray-800 font-medium">Empty Return Entry</span>
                        </button>
                        <button 
                          onClick={() => setActiveForm('payment')}
                          className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 hover:border-green-600 hover:bg-gray-50 transition text-center"
                        >
                          <DollarSign className="w-6 h-6 text-green-600" />
                          <span className="text-xs font-semibold text-gray-800 font-medium">Customer Payment</span>
                        </button>
                        <button 
                          onClick={() => setActiveForm('incident')}
                          className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 hover:border-red-600 hover:bg-gray-50 transition text-center"
                        >
                          <AlertOctagon className="w-6 h-6 text-red-600" />
                          <span className="text-xs font-semibold text-gray-800 font-medium">Report Damage / Leakage</span>
                        </button>
                      </div>
                    </div>

                    {/* My Recent Submissions List */}
                    <div className="bg-white border border-[#E8EAF0] rounded-xl p-5 shadow-sm">
                      <h3 className="text-sm font-bold text-[#02164F] mb-4">My Recent Submissions</h3>
                      <div className="space-y-3.5">
                        {filteredDeliveries.slice(0, 8).map(del => {
                          const cust = dbData.customers?.find(c => c.id === del.customerId) || { name: 'Direct/Walk-in' };
                          const statusColor = del.verificationStatus === 'APPROVED' 
                            ? 'bg-green-100 text-green-700' 
                            : (del.verificationStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700');
                          const item = del.deliveryItems?.[0] || {};
                          return (
                            <div key={del.id} className="flex justify-between items-center text-xs border-b border-gray-50 pb-2.5 last:border-0 last:pb-0">
                              <div>
                                <p className="font-bold text-gray-800">{del.customerName || cust.name}</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">{new Date(del.deliveryDate).toLocaleDateString()}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <p className="font-semibold text-gray-800">₹{del.totalAmount}</p>
                                  <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold uppercase mt-1 ${statusColor}`}>
                                    {del.verificationStatus}
                                  </span>
                                </div>
                                <button 
                                  onClick={() => triggerPrintJob('invoice', {
                                    invoiceNumber: `INV-${del.id.slice(-6).toUpperCase()}`,
                                    invoiceDate: del.deliveryDate,
                                    customerName: del.customerName || cust.name,
                                    quantity: item.quantityDelivered,
                                    rate: item.ratePerCylinder,
                                    totalAmount: del.totalAmount,
                                    paidAmount: del.amountReceived,
                                    balanceAmount: del.amountPending,
                                    paymentStatus: del.paymentStatus
                                  })}
                                  className="p-1 text-[#02164F] hover:bg-gray-100 rounded transition"
                                  title="Print Slip"
                                >
                                  <Printer className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                        {filteredDeliveries.length === 0 && (
                          <div className="text-center text-gray-400 py-12 text-xs">
                            No submissions recorded yet.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* AUDITOR DASHBOARD VIEW */}
                {/* ========================================================================= */}
                {isAuditor && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 animate-fade-in">
                    {/* Financial Summary & PDF downloads */}
                    <div className="lg:col-span-2 space-y-6">
                      <div className="bg-white border border-[#E8EAF0] rounded-xl p-5 shadow-sm">
                        <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
                          <h3 className="text-sm font-bold text-[#02164F]">Financial Ledger Summary</h3>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => triggerPrintJob('account_ledger', {})} 
                              className="px-2.5 py-1 bg-white border border-[#E8EAF0] text-gray-700 hover:bg-gray-50 text-[10px] rounded font-bold transition flex items-center gap-1"
                            >
                              <Printer className="w-3 h-3" /> Account Ledger
                            </button>
                            <button 
                              onClick={() => triggerPrintJob('commercial_ledger', {})} 
                              className="px-2.5 py-1 bg-white border border-[#E8EAF0] text-gray-700 hover:bg-gray-50 text-[10px] rounded font-bold transition flex items-center gap-1"
                            >
                              <Printer className="w-3 h-3" /> Commercial Ledger
                            </button>
                          </div>
                        </div>
                        <div className="space-y-3.5">
                          <div className="flex justify-between items-center text-xs border-b border-gray-50 pb-2.5">
                            <span className="text-gray-500 font-medium">Gross Cash Received today:</span>
                            <span className="font-bold text-[#02164F] text-sm">₹{dbData.kpis?.todayCashCollection?.toLocaleString() || 0}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs border-b border-gray-50 pb-2.5">
                            <span className="text-gray-500 font-medium">Staff Wages paid today:</span>
                            <span className="font-bold text-red-600 text-sm">₹{dbData.kpis?.staffPaymentsToday?.toLocaleString() || 0}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs border-b border-gray-50 pb-2.5">
                            <span className="text-gray-500 font-medium">Credit rollovers outstanding:</span>
                            <span className="font-bold text-yellow-600 text-sm">₹{dbData.kpis?.pendingCommercialAmount?.toLocaleString() || 0}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs pt-2">
                            <span className="text-gray-800 font-bold text-sm">Estimated Operational Treasury Balance:</span>
                            <span className="font-extrabold text-green-600 text-sm">₹{((dbData.kpis?.todayCashCollection || 0) - (dbData.kpis?.staffPaymentsToday || 0)).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Daily Invoices list for Auditor */}
                      <div className="bg-white border border-[#E8EAF0] rounded-xl p-5 shadow-sm">
                        <h3 className="text-sm font-bold text-[#02164F] mb-4">Daily Invoices</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left border-collapse min-w-[500px]">
                            <thead>
                              <tr className="border-b border-[#E8EAF0] text-gray-500 font-bold bg-gray-50/50">
                                <th className="p-3">Invoice No</th>
                                <th className="p-3">Date</th>
                                <th className="p-3">Customer</th>
                                <th className="p-3">Total Amount</th>
                                <th className="p-3">Status</th>
                                <th className="p-3 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {dbData.invoices?.slice(0, 5).map(inv => {
                                const cust = dbData.customers?.find(c => c.id === inv.customerId) || { name: 'Direct Customer' };
                                return (
                                  <tr key={inv.id} className="hover:bg-gray-50/50">
                                    <td className="p-3 font-mono font-bold text-[#02164F]">{inv.invoiceNumber}</td>
                                    <td className="p-3">{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                                    <td className="p-3 font-semibold">{inv.customerName || cust.name}</td>
                                    <td className="p-3">₹{inv.totalAmount}</td>
                                    <td className="p-3">
                                      <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${inv.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {inv.paymentStatus}
                                      </span>
                                    </td>
                                    <td className="p-3 text-right">
                                      <button 
                                        onClick={() => triggerPrintJob('invoice', {
                                          invoiceNumber: inv.invoiceNumber,
                                          invoiceDate: inv.invoiceDate,
                                          customerName: inv.customerName || cust.name,
                                          quantity: inv.quantity,
                                          rate: inv.rate,
                                          totalAmount: inv.totalAmount,
                                          paidAmount: inv.paidAmount,
                                          balanceAmount: inv.balanceAmount,
                                          paymentStatus: inv.paymentStatus
                                        })}
                                        className="p-1 text-[#02164F] hover:bg-gray-100 rounded transition"
                                        title="Print Invoice"
                                      >
                                        <Printer className="w-4 h-4 inline" />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                              {(!dbData.invoices || dbData.invoices.length === 0) && (
                                <tr>
                                  <td colSpan="6" className="text-center text-gray-400 py-6">No invoices created yet.</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Daily Closing Reports list for Auditor */}
                      <div className="bg-white border border-[#E8EAF0] rounded-xl p-5 shadow-sm">
                        <h3 className="text-sm font-bold text-[#02164F] mb-4">Daily Closing Reports</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left border-collapse min-w-[500px]">
                            <thead>
                              <tr className="border-b border-[#E8EAF0] text-gray-500 font-bold bg-gray-50/50">
                                <th className="p-3">Closing Date</th>
                                <th className="p-3">Physical 14.2 Filled</th>
                                <th className="p-3">Physical 19 Filled</th>
                                <th className="p-3">Cash in Hand</th>
                                <th className="p-3">Mismatch</th>
                                <th className="p-3 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {dbData.dailyClosings?.slice(0, 5).map(close => (
                                  <tr key={close.id} className="hover:bg-gray-50/50">
                                    <td className="p-3 font-semibold">{new Date(close.closingDate).toLocaleDateString()}</td>
                                    <td className="p-3">{close.physical14Filled}</td>
                                    <td className="p-3">{close.physical19Filled}</td>
                                    <td className="p-3">₹{close.cashInHand?.toLocaleString()}</td>
                                    <td className="p-3">
                                      {close.mismatch14Filled !== 0 || close.mismatch14Empty !== 0 ? (
                                        <span className="text-red-600 font-bold">Yes</span>
                                      ) : (
                                        <span className="text-green-600">None</span>
                                      )}
                                    </td>
                                    <td className="p-3 text-right">
                                      <button 
                                        onClick={() => triggerPrintJob('closing', close)}
                                        className="p-1 text-[#02164F] hover:bg-gray-100 rounded transition"
                                        title="Print Closing Report"
                                      >
                                        <Printer className="w-4 h-4 inline" />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              {(!dbData.dailyClosings || dbData.dailyClosings.length === 0) && (
                                <tr>
                                  <td colSpan="6" className="text-center text-gray-400 py-6">No closing reports logged.</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* Right column: Physical Verification Form & Logs */}
                    <div className="space-y-6">
                      <div className="bg-white border border-[#E8EAF0] rounded-xl p-5 shadow-sm">
                        <h3 className="text-sm font-bold text-[#02164F] mb-3">Auditor - Physical Verification Upload</h3>
                        <form onSubmit={handleAuditorVerificationSubmit} className="space-y-4">
                          <div className="flex flex-col gap-1 text-xs">
                            <label className="font-semibold text-gray-700">Verification Date*</label>
                            <input 
                              type="date" 
                              required
                              className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none bg-white" 
                              value={auditorVerificationForm.verificationDate}
                              onChange={e => setAuditorVerificationForm(prev => ({ ...prev, verificationDate: e.target.value }))}
                            />
                          </div>

                          <div className="flex flex-col gap-1 text-xs">
                            <label className="font-semibold text-gray-700">Link Closing Report (Optional)</label>
                            <select 
                              className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none bg-white"
                              value={auditorVerificationForm.closingId || ''}
                              onChange={e => setAuditorVerificationForm(prev => ({ ...prev, closingId: e.target.value }))}
                            >
                              <option value="">-- No link --</option>
                              {dbData.dailyClosings?.map(close => (
                                <option key={close.id} value={close.id}>Report: {new Date(close.closingDate).toLocaleDateString()}</option>
                              ))}
                            </select>
                          </div>

                          <div className="flex flex-col gap-1 text-xs">
                            <label className="font-semibold text-gray-700">Upload Godown Stock Image</label>
                            <input 
                              type="file" 
                              accept="image/*"
                              className="border border-[#E8EAF0] rounded p-1.5 text-xs outline-none bg-gray-50 cursor-pointer"
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setAuditorVerificationForm(prev => ({ ...prev, imageUrl: reader.result }));
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                            {auditorVerificationForm.imageUrl && (
                              <img src={auditorVerificationForm.imageUrl} alt="Preview" className="w-full h-32 object-cover rounded-lg border border-[#E8EAF0] mt-2" />
                            )}
                          </div>

                          <div className="flex flex-col gap-1 text-xs">
                            <label className="font-semibold text-gray-700">Verification Notes / Mismatch Observations</label>
                            <textarea 
                              placeholder="e.g. Godown inspected, counts match expected, no discrepancies."
                              className="border border-[#E8EAF0] rounded p-2 text-xs h-20 focus:border-[#F37022] outline-none"
                              value={auditorVerificationForm.notes || ''}
                              onChange={e => setAuditorVerificationForm(prev => ({ ...prev, notes: e.target.value }))}
                            />
                          </div>

                          <button 
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-2 bg-[#F37022] hover:bg-[#F37022]/90 text-white rounded text-xs font-bold transition mt-2 disabled:opacity-50"
                          >
                            {isSubmitting ? 'Uploading...' : 'Upload Image & Submit'}
                          </button>
                        </form>
                      </div>

                      {/* Verification Logs List */}
                      <div className="bg-white border border-[#E8EAF0] rounded-xl p-5 shadow-sm">
                        <h3 className="text-sm font-bold text-[#02164F] mb-4">Past Auditor Verifications</h3>
                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                          {dbData.auditorVerifications?.map(log => (
                            <div key={log.id} className="border border-gray-100 rounded-xl p-3 bg-gray-50 text-xs flex flex-col gap-2 shadow-sm">
                              <div className="flex justify-between items-center">
                                <span className="font-semibold text-gray-800">{new Date(log.verificationDate).toLocaleDateString()}</span>
                                <span className="text-[10px] text-gray-400 font-mono">By {log.uploadedBy}</span>
                              </div>
                              <p className="text-gray-600 text-[11px] leading-tight">{log.notes || 'No notes added.'}</p>
                              {log.imageUrl && (
                                <div className="relative group cursor-pointer" onClick={() => window.open(log.imageUrl, '_blank')}>
                                  <img src={log.imageUrl} alt="Verification" className="w-full h-24 object-cover rounded-lg border border-gray-100" />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-bold text-[10px] rounded-lg transition-all">Click to zoom</div>
                                </div>
                              )}
                              <button 
                                onClick={() => triggerPrintJob('auditor_verification', log)}
                                className="w-full py-1 text-[10px] text-gray-700 hover:text-white border border-[#E8EAF0] hover:bg-[#02164F] rounded transition font-bold mt-1"
                              >
                                Print Verification Report
                              </button>
                            </div>
                          ))}
                          {(!dbData.auditorVerifications || dbData.auditorVerifications.length === 0) && (
                            <p className="text-center text-gray-400 py-6 text-xs">No verification logs recorded.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* --- TAB 2: OPERATIONAL FORMS DIRECTORY (ADMIN / MANAGER only) --- */}
            {activeTab === 'forms' && isAdmin && (
              <div>
                <div className="page-header mb-6">
                  <h1 className="text-2xl font-bold text-[#02164F]">IOCL Operational Forms</h1>
                  <p className="text-sm text-gray-500">Record warehouse arrivals, customer contracts, sales, incidents, and stock tuning</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-white border border-[#E8EAF0] p-5 rounded-xl hover:border-[#F37022] transition shadow-sm flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-[#02164F] text-sm">1. Customer Creation Form</h3>
                      <p className="text-xs text-gray-500 mt-1">Create verified customer profiles for domestic/commercial sales linkings.</p>
                    </div>
                    <button onClick={() => setActiveForm('customer')} className="mt-4 px-3 py-1.5 bg-[#02164F] hover:bg-[#02164F]/90 text-white rounded text-xs font-semibold self-start flex items-center gap-1">
                      Open Form &rarr;
                    </button>
                  </div>

                  <div className="bg-white border border-[#E8EAF0] p-5 rounded-xl hover:border-[#F37022] transition shadow-sm flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-[#02164F] text-sm">2. Domestic Refill Delivery Form</h3>
                      <p className="text-xs text-gray-500 mt-1">Log domestic 14.2 kg cylinder sales and empty return counts.</p>
                    </div>
                    <button onClick={() => setActiveForm('domestic')} className="mt-4 px-3 py-1.5 bg-[#02164F] hover:bg-[#02164F]/90 text-white rounded text-xs font-semibold self-start flex items-center gap-1">
                      Open Form &rarr;
                    </button>
                  </div>

                  <div className="bg-white border border-[#E8EAF0] p-5 rounded-xl hover:border-[#F37022] transition shadow-sm flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-[#02164F] text-sm">3. Commercial Refill Delivery Form</h3>
                      <p className="text-xs text-gray-500 mt-1">Log commercial 19 kg sales, payments received, and credit rollovers.</p>
                    </div>
                    <button onClick={() => setActiveForm('commercial')} className="mt-4 px-3 py-1.5 bg-[#02164F] hover:bg-[#02164F]/90 text-white rounded text-xs font-semibold self-start flex items-center gap-1">
                      Open Form &rarr;
                    </button>
                  </div>

                  <div className="bg-white border border-[#E8EAF0] p-5 rounded-xl hover:border-[#F37022] transition shadow-sm flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-[#02164F] text-sm">4. New Connection Form</h3>
                      <p className="text-xs text-gray-500 mt-1">Register new SBC/DBC cylinder connection contracts and deposits.</p>
                    </div>
                    <button onClick={() => setActiveForm('connection')} className="mt-4 px-3 py-1.5 bg-[#02164F] hover:bg-[#02164F]/90 text-white rounded text-xs font-semibold self-start flex items-center gap-1">
                      Open Form &rarr;
                    </button>
                  </div>

                  <div className="bg-white border border-[#E8EAF0] p-5 rounded-xl hover:border-[#F37022] transition shadow-sm flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-[#02164F] text-sm">5. Empty Return Form</h3>
                      <p className="text-xs text-gray-500 mt-1">Log cylinder returns from credit customers to reconcile balances.</p>
                    </div>
                    <button onClick={() => setActiveForm('empty_return')} className="mt-4 px-3 py-1.5 bg-[#02164F] hover:bg-[#02164F]/90 text-white rounded text-xs font-semibold self-start flex items-center gap-1">
                      Open Form &rarr;
                    </button>
                  </div>

                  <div className="bg-white border border-[#E8EAF0] p-5 rounded-xl hover:border-[#F37022] transition shadow-sm flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-[#02164F] text-sm">6. Truck Unload Entry Form</h3>
                      <p className="text-xs text-gray-500 mt-1">Log arrival of refinery trucks with filled inventory and returns.</p>
                    </div>
                    <button onClick={() => setActiveForm('load')} className="mt-4 px-3 py-1.5 bg-[#02164F] hover:bg-[#02164F]/90 text-white rounded text-xs font-semibold self-start flex items-center gap-1">
                      Open Form &rarr;
                    </button>
                  </div>

                  <div className="bg-white border border-[#E8EAF0] p-5 rounded-xl hover:border-[#F37022] transition shadow-sm flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-[#02164F] text-sm">7. Daily Closing stock Form</h3>
                      <p className="text-xs text-gray-500 mt-1">Log physical EOD inventory stock count and cash in hand.</p>
                    </div>
                    <button onClick={() => setActiveForm('closing')} className="mt-4 px-3 py-1.5 bg-[#02164F] hover:bg-[#02164F]/90 text-white rounded text-xs font-semibold self-start flex items-center gap-1">
                      Open Form &rarr;
                    </button>
                  </div>

                  <div className="bg-white border border-[#E8EAF0] p-5 rounded-xl hover:border-[#F37022] transition shadow-sm flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-[#02164F] text-sm">8. Cylinder Incident damage Form</h3>
                      <p className="text-xs text-gray-500 mt-1">Log leakages, valve defects, or broken cylinders to isolate stock.</p>
                    </div>
                    <button onClick={() => setActiveForm('incident')} className="mt-4 px-3 py-1.5 bg-[#02164F] hover:bg-[#02164F]/90 text-white rounded text-xs font-semibold self-start flex items-center gap-1">
                      Open Form &rarr;
                    </button>
                  </div>

                  <div className="bg-white border border-[#E8EAF0] p-5 rounded-xl hover:border-[#F37022] transition shadow-sm flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-[#02164F] text-sm">9. Expense Entry Form</h3>
                      <p className="text-xs text-gray-500 mt-1">Log godown expenses, truck fuel, or daily staff labor wages.</p>
                    </div>
                    <button onClick={() => setActiveForm('expense')} className="mt-4 px-3 py-1.5 bg-[#02164F] hover:bg-[#02164F]/90 text-white rounded text-xs font-semibold self-start flex items-center gap-1">
                      Open Form &rarr;
                    </button>
                  </div>

                  <div className="bg-white border border-[#E8EAF0] p-5 rounded-xl hover:border-[#F37022] transition shadow-sm flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-[#02164F] text-sm">10. Customer Payment Form</h3>
                      <p className="text-xs text-gray-500 mt-1">Record store credit and payment recoveries from commercial customers.</p>
                    </div>
                    <button onClick={() => setActiveForm('payment')} className="mt-4 px-3 py-1.5 bg-[#02164F] hover:bg-[#02164F]/90 text-white rounded text-xs font-semibold self-start flex items-center gap-1">
                      Open Form &rarr;
                    </button>
                  </div>

                  <div className="bg-white border border-[#E8EAF0] p-5 rounded-xl hover:border-[#F37022] transition shadow-sm flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-[#02164F] text-sm">11. Custom Invoice Creation</h3>
                      <p className="text-xs text-gray-500 mt-1">Issue wholesale bills to commercial customers directly.</p>
                    </div>
                    <button onClick={() => setActiveForm('invoice')} className="mt-4 px-3 py-1.5 bg-[#02164F] hover:bg-[#02164F]/90 text-white rounded text-xs font-semibold self-start flex items-center gap-1">
                      Open Form &rarr;
                    </button>
                  </div>

                  <div className="bg-white border border-[#E8EAF0] p-5 rounded-xl hover:border-[#F37022] transition shadow-sm flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-[#02164F] text-sm">12. Direct Stock Adjustment</h3>
                      <p className="text-xs text-gray-500 mt-1">Manually adjust inventory filled/empty stocks (Admin only).</p>
                    </div>
                    <button onClick={() => setActiveForm('stock_adjustment')} className="mt-4 px-3 py-1.5 bg-[#02164F] hover:bg-[#02164F]/90 text-white rounded text-xs font-semibold self-start flex items-center gap-1">
                      Open Form &rarr;
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* --- TAB 3: COMMERCIAL CREDIT LEDGER (ADMIN / AUDITOR) --- */}
            {activeTab === 'commercial' && (
              <div>
                <div className="page-header mb-6 flex justify-between items-center">
                  <div>
                    <h1 className="text-2xl font-bold text-[#02164F]">Commercial Credit & Outstanding Ledger</h1>
                    <p className="text-sm text-gray-500">Track outstanding commercial billings and empty cylinders returns</p>
                  </div>
                  <button onClick={() => window.print()} className="px-3 py-1.5 bg-[#02164F] text-white rounded text-xs font-semibold hover:bg-[#02164F]/90 print:hidden">
                    Download PDF
                  </button>
                </div>

                <div className="bg-white border border-[#E8EAF0] rounded-xl shadow-sm overflow-x-auto">
                  <table className="min-w-full text-xs text-left">
                    <thead className="bg-gray-50 text-gray-700 font-bold uppercase border-b border-[#E8EAF0]">
                      <tr>
                        <th className="px-4 py-3">Customer</th>
                        <th className="px-4 py-3">Billed Qty</th>
                        <th className="px-4 py-3">Pending Empties</th>
                        <th className="px-4 py-3">Total Amount</th>
                        <th className="px-4 py-3">Pending Balance</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-800">
                      {dbData.commercialLedger?.map(ledger => {
                        return (
                          <tr key={ledger.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-semibold">{ledger.customerName}</td>
                            <td className="px-4 py-3">{ledger.quantityDelivered} (19 kg)</td>
                            <td className="px-4 py-3 font-mono font-bold text-orange-600">{ledger.emptyPending} unit</td>
                            <td className="px-4 py-3">₹{ledger.amountBilled}</td>
                            <td className="px-4 py-3 font-semibold text-red-600">₹{ledger.amountPending}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                ledger.status === 'clear' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {ledger.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}

                      {(!dbData.commercialLedger || dbData.commercialLedger.length === 0) && (
                        <tr>
                          <td colSpan="6" className="text-center text-gray-400 py-12">No commercial credit balances logged.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* --- TAB 4: REPORTS & AUDITS --- */}
            {activeTab === 'reports' && (
              <div>
                <div className="page-header mb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-[#02164F]">Reports & Security Audits</h1>
                    <p className="text-sm text-gray-500">Security audit history, employee tracking logs, and printable operational statements</p>
                  </div>
                  <div className="flex gap-2.5 print:hidden">
                    <button 
                      onClick={() => handleCSVDownload(selectedReportType)}
                      disabled={isLoading}
                      className="px-3 py-1.5 bg-white border border-[#E8EAF0] text-[#02164F] rounded text-xs font-bold hover:bg-gray-50 transition active:scale-95 disabled:opacity-50"
                    >
                      Download CSV
                    </button>
                    <button 
                      onClick={() => handlePDFDownload(selectedReportType)}
                      disabled={isLoading}
                      className="px-3 py-1.5 bg-[#F37022] text-white rounded text-xs font-bold hover:bg-[#F37022]/90 transition active:scale-95 disabled:opacity-50"
                    >
                      Download PDF
                    </button>
                    <button 
                      onClick={() => window.print()} 
                      className="px-3 py-1.5 bg-[#02164F] text-white rounded text-xs font-bold hover:bg-[#02164F]/90 transition active:scale-95"
                    >
                      Print Report
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Sidebar Selection */}
                  <div className="lg:col-span-1 bg-white border border-[#E8EAF0] rounded-xl p-4 shadow-sm h-fit space-y-1 print:hidden">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2 px-2">Select Report Registry</span>
                    {getAvailableReports().map(rep => (
                      <button
                        key={rep.id}
                        type="button"
                        onClick={() => setSelectedReportType(rep.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition ${
                          selectedReportType === rep.id 
                            ? 'bg-[#02164F]/5 text-[#02164F] font-bold' 
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {rep.name}
                      </button>
                    ))}
                  </div>

                  {/* Report Output Viewer */}
                  <div className="lg:col-span-3 bg-white border border-[#E8EAF0] rounded-xl p-5 shadow-sm space-y-4">
                    <div className="border-b border-gray-100 pb-3">
                      <h3 className="text-sm font-bold text-[#02164F] capitalize">
                        {getAvailableReports().find(r => r.id === selectedReportType)?.name || selectedReportType} Report
                      </h3>
                      <p className="text-xs text-gray-400 mt-1">
                        Displaying active records stored in standard ledger. Click download to retrieve complete history.
                      </p>
                    </div>

                    {selectedReportType === 'deliveries' && (
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-xs text-left">
                          <thead className="bg-gray-50 border-b border-gray-100 font-bold text-gray-700">
                            <tr>
                              <th className="px-3 py-2">Date</th>
                              <th className="px-3 py-2">Customer</th>
                              <th className="px-3 py-2">Cylinders</th>
                              <th className="px-3 py-2">Paid</th>
                              <th className="px-3 py-2">Status</th>
                              <th className="px-3 py-2">Verification</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {dbData.deliveries?.map(d => {
                              const item = d.deliveryItems?.[0] || {};
                              return (
                                <tr key={d.id} className="hover:bg-gray-50/50">
                                  <td className="px-3 py-2">{new Date(d.deliveryDate).toLocaleDateString()}</td>
                                  <td className="px-3 py-2 font-semibold">{d.customerName}</td>
                                  <td className="px-3 py-2">{item.quantityDelivered || 0} x {item.cylinderType === 'DOMESTIC_14_2' ? '14.2kg' : '19kg'}</td>
                                  <td className="px-3 py-2">₹{d.amountReceived}</td>
                                  <td className="px-3 py-2 uppercase font-bold text-[9px]">{d.paymentStatus}</td>
                                  <td className="px-3 py-2">
                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                                      d.verificationStatus === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                      {d.verificationStatus}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                            {(!dbData.deliveries || dbData.deliveries.length === 0) && (
                              <tr>
                                <td colSpan="6" className="text-center text-gray-400 py-8">No deliveries found.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {selectedReportType === 'invoices' && (
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-xs text-left">
                          <thead className="bg-gray-50 border-b border-gray-100 font-bold text-gray-700">
                            <tr>
                              <th className="px-3 py-2">Invoice #</th>
                              <th className="px-3 py-2">Date</th>
                              <th className="px-3 py-2">Customer</th>
                              <th className="px-3 py-2">Total Amount</th>
                              <th className="px-3 py-2">Paid</th>
                              <th className="px-3 py-2">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {dbData.invoices?.map(inv => (
                              <tr key={inv.id} className="hover:bg-gray-50/50">
                                <td className="px-3 py-2 font-mono font-bold text-[#02164F]">{inv.invoiceNumber}</td>
                                <td className="px-3 py-2">{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                                <td className="px-3 py-2 font-semibold">{inv.customerName}</td>
                                <td className="px-3 py-2">₹{inv.totalAmount}</td>
                                <td className="px-3 py-2">₹{inv.paidAmount}</td>
                                <td className="px-3 py-2">
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                    inv.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                  }`}>
                                    {inv.paymentStatus}
                                  </span>
                                </td>
                              </tr>
                            ))}
                            {(!dbData.invoices || dbData.invoices.length === 0) && (
                              <tr>
                                <td colSpan="6" className="text-center text-gray-400 py-8">No invoices found.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {selectedReportType === 'closings' && (
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-xs text-left">
                          <thead className="bg-gray-50 border-b border-gray-100 font-bold text-gray-700">
                            <tr>
                              <th className="px-3 py-2">Date</th>
                              <th className="px-3 py-2">Physical 14kg (F/E)</th>
                              <th className="px-3 py-2">Physical 19kg (F/E)</th>
                              <th className="px-3 py-2">Cash In Hand</th>
                              <th className="px-3 py-2">Mismatch 14kg (F/E)</th>
                              <th className="px-3 py-2">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {dbData.dailyClosings?.map(c => (
                              <tr key={c.id} className="hover:bg-gray-50/50">
                                <td className="px-3 py-2 font-semibold">{new Date(c.closingDate).toLocaleDateString()}</td>
                                <td className="px-3 py-2">F: {c.physical14Filled} | E: {c.physical14Empty}</td>
                                <td className="px-3 py-2">F: {c.physical19Filled} | E: {c.physical19Empty}</td>
                                <td className="px-3 py-2">₹{c.cashInHand?.toLocaleString()}</td>
                                <td className="px-3 py-2 text-red-600 font-bold">F: {c.mismatch14Filled} | E: {c.mismatch14Empty}</td>
                                <td className="px-3 py-2">
                                  <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-green-100 text-green-700">LOCKED</span>
                                </td>
                              </tr>
                            ))}
                            {(!dbData.dailyClosings || dbData.dailyClosings.length === 0) && (
                              <tr>
                                <td colSpan="6" className="text-center text-gray-400 py-8">No daily closing audits recorded.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {selectedReportType === 'commercialLedger' && (
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-xs text-left">
                          <thead className="bg-gray-50 border-b border-gray-100 font-bold text-gray-700">
                            <tr>
                              <th className="px-3 py-2">Customer</th>
                              <th className="px-3 py-2">Details</th>
                              <th className="px-3 py-2">Delivered / Returned</th>
                              <th className="px-3 py-2">Pending Empties</th>
                              <th className="px-3 py-2">Billed / Received</th>
                              <th className="px-3 py-2">Pending Amount</th>
                              <th className="px-3 py-2">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {dbData.commercialLedger?.map(l => (
                              <tr key={l.id} className="hover:bg-gray-50/50">
                                <td className="px-3 py-2 font-semibold">{l.customerName}</td>
                                <td className="px-3 py-2 text-gray-500">{l.cylinderType} | {l.mobileNumber || 'N/A'}</td>
                                <td className="px-3 py-2">{l.quantityDelivered} / {l.emptyReturned}</td>
                                <td className="px-3 py-2 font-bold text-orange-600">{l.emptyPending}</td>
                                <td className="px-3 py-2">₹{l.amountBilled} / ₹{l.amountReceived}</td>
                                <td className="px-3 py-2 font-bold text-red-600">₹{l.amountPending}</td>
                                <td className="px-3 py-2 uppercase font-bold text-[8px]">{l.status}</td>
                              </tr>
                            ))}
                            {(!dbData.commercialLedger || dbData.commercialLedger.length === 0) && (
                              <tr>
                                <td colSpan="7" className="text-center text-gray-400 py-8">No ledger entries found.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {selectedReportType === 'payments' && (
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-xs text-left">
                          <thead className="bg-gray-50 border-b border-gray-100 font-bold text-gray-700">
                            <tr>
                              <th className="px-3 py-2">Date</th>
                              <th className="px-3 py-2">Customer</th>
                              <th className="px-3 py-2">Amount</th>
                              <th className="px-3 py-2">Mode</th>
                              <th className="px-3 py-2">Verification</th>
                              <th className="px-3 py-2">Remarks</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {dbData.payments?.map(p => (
                              <tr key={p.id} className="hover:bg-gray-50/50">
                                <td className="px-3 py-2">{new Date(p.paymentDate).toLocaleDateString()}</td>
                                <td className="px-3 py-2 font-semibold">{p.customerName}</td>
                                <td className="px-3 py-2 font-bold text-green-700">₹{p.amount}</td>
                                <td className="px-3 py-2">{p.paymentMode}</td>
                                <td className="px-3 py-2">
                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                                    p.verificationStatus === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                  }`}>
                                    {p.verificationStatus}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-gray-500">{p.remarks}</td>
                              </tr>
                            ))}
                            {(!dbData.payments || dbData.payments.length === 0) && (
                              <tr>
                                <td colSpan="6" className="text-center text-gray-400 py-8">No payments logged yet.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {selectedReportType === 'expenses' && (
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-xs text-left">
                          <thead className="bg-gray-50 border-b border-gray-100 font-bold text-gray-700">
                            <tr>
                              <th className="px-3 py-2">Date</th>
                              <th className="px-3 py-2">Category</th>
                              <th className="px-3 py-2">Amount</th>
                              <th className="px-3 py-2">Paid To</th>
                              <th className="px-3 py-2">Payment Mode</th>
                              <th className="px-3 py-2">Remarks</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {dbData.expenses?.map(e => (
                              <tr key={e.id} className="hover:bg-gray-50/50">
                                <td className="px-3 py-2">{new Date(e.expenseDate).toLocaleDateString()}</td>
                                <td className="px-3 py-2 font-semibold capitalize">{e.category.replace('_', ' ')}</td>
                                <td className="px-3 py-2 font-bold text-red-600">₹{e.amount}</td>
                                <td className="px-3 py-2">{e.paidTo}</td>
                                <td className="px-3 py-2">{e.paymentMode}</td>
                                <td className="px-3 py-2 text-gray-500">{e.remarks}</td>
                              </tr>
                            ))}
                            {(!dbData.expenses || dbData.expenses.length === 0) && (
                              <tr>
                                <td colSpan="6" className="text-center text-gray-400 py-8">No expenses recorded yet.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {selectedReportType === 'stockMovement' && (
                      <div className="p-8 text-center text-xs space-y-3">
                        <TrendingUp className="w-8 h-8 text-[#02164F] mx-auto animate-pulse" />
                        <h4 className="font-bold text-gray-800">Stock Movement Audit Trail</h4>
                        <p className="text-gray-500 max-w-md mx-auto">
                          The stock movement database holds large sequence tables tracking direct telemetry inputs. Export to CSV or PDF to review the full registry log.
                        </p>
                      </div>
                    )}

                    {selectedReportType === 'auditorVerifications' && (
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-xs text-left">
                          <thead className="bg-gray-50 border-b border-gray-100 font-bold text-gray-700">
                            <tr>
                              <th className="px-3 py-2">Date</th>
                              <th className="px-3 py-2">Verified By</th>
                              <th className="px-3 py-2">Notes</th>
                              <th className="px-3 py-2">Closing ID</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {dbData.auditorVerifications?.map(v => (
                              <tr key={v.id} className="hover:bg-gray-50/50">
                                <td className="px-3 py-2 font-semibold">{new Date(v.verificationDate).toLocaleDateString()}</td>
                                <td className="px-3 py-2">{v.uploadedBy}</td>
                                <td className="px-3 py-2 text-gray-500">{v.notes || 'No notes'}</td>
                                <td className="px-3 py-2 font-mono text-[10px] text-gray-400">{v.closingId || 'None'}</td>
                              </tr>
                            ))}
                            {(!dbData.auditorVerifications || dbData.auditorVerifications.length === 0) && (
                              <tr>
                                <td colSpan="4" className="text-center text-gray-400 py-8">No physical verifications found.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {selectedReportType === 'monthlyArchives' && (
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-xs text-left">
                          <thead className="bg-gray-50 border-b border-gray-100 font-bold text-gray-700">
                            <tr>
                              <th className="px-3 py-2">Month/Year</th>
                              <th className="px-3 py-2">Deliveries</th>
                              <th className="px-3 py-2">Cash Collected</th>
                              <th className="px-3 py-2">Expenses</th>
                              <th className="px-3 py-2">Created By</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {dbData.monthlyArchives?.map(m => (
                              <tr key={m.id} className="hover:bg-gray-50/50">
                                <td className="px-3 py-2 font-bold">{m.month}/{m.year}</td>
                                <td className="px-3 py-2">{m.totalDeliveries}</td>
                                <td className="px-3 py-2 text-green-700 font-semibold">₹{m.totalCashReceived}</td>
                                <td className="px-3 py-2 text-red-600 font-semibold">₹{m.totalExpenses}</td>
                                <td className="px-3 py-2">{m.createdBy}</td>
                              </tr>
                            ))}
                            {(!dbData.monthlyArchives || dbData.monthlyArchives.length === 0) && (
                              <tr>
                                <td colSpan="5" className="text-center text-gray-400 py-8">No monthly archives generated yet.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {selectedReportType === 'incidents' && (
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-xs text-left">
                          <thead className="bg-gray-50 border-b border-gray-100 font-bold text-gray-700">
                            <tr>
                              <th className="px-3 py-2">Date</th>
                              <th className="px-3 py-2">Category</th>
                              <th className="px-3 py-2">Issue / Defect</th>
                              <th className="px-3 py-2">Qty</th>
                              <th className="px-3 py-2">Location</th>
                              <th className="px-3 py-2">Reported By</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {dbData.incidents?.map(inc => (
                              <tr key={inc.id} className="hover:bg-gray-50/50">
                                <td className="px-3 py-2">{new Date(inc.incidentDate).toLocaleDateString()}</td>
                                <td className="px-3 py-2 font-semibold">{inc.incidentCategory}</td>
                                <td className="px-3 py-2">{inc.issueType}</td>
                                <td className="px-3 py-2">{inc.quantity}</td>
                                <td className="px-3 py-2">{inc.location}</td>
                                <td className="px-3 py-2">{inc.reportedBy}</td>
                              </tr>
                            ))}
                            {(!dbData.incidents || dbData.incidents.length === 0) && (
                              <tr>
                                <td colSpan="6" className="text-center text-gray-400 py-8">No incidents reported.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {selectedReportType === 'connections' && (
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-xs text-left">
                          <thead className="bg-gray-50 border-b border-gray-100 font-bold text-gray-700">
                            <tr>
                              <th className="px-3 py-2">Date</th>
                              <th className="px-3 py-2">Customer</th>
                              <th className="px-3 py-2">Type</th>
                              <th className="px-3 py-2">Total Amount</th>
                              <th className="px-3 py-2">Paid</th>
                              <th className="px-3 py-2">Verification</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {dbData.connections?.map(c => (
                              <tr key={c.id} className="hover:bg-gray-50/50">
                                <td className="px-3 py-2">{new Date(c.connectionDate).toLocaleDateString()}</td>
                                <td className="px-3 py-2 font-semibold">{c.customerName}</td>
                                <td className="px-3 py-2 text-gray-500">{c.connectionType}</td>
                                <td className="px-3 py-2">₹{c.totalAmount}</td>
                                <td className="px-3 py-2">₹{c.amountPaid}</td>
                                <td className="px-3 py-2">
                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                                    c.verificationStatus === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                  }`}>
                                    {c.verificationStatus}
                                  </span>
                                </td>
                              </tr>
                            ))}
                            {(!dbData.connections || dbData.connections.length === 0) && (
                              <tr>
                                <td colSpan="6" className="text-center text-gray-400 py-8">No new connections logged.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {selectedReportType === 'emptyReturns' && (
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-xs text-left">
                          <thead className="bg-gray-50 border-b border-gray-100 font-bold text-gray-700">
                            <tr>
                              <th className="px-3 py-2">Date</th>
                              <th className="px-3 py-2">Customer</th>
                              <th className="px-3 py-2">Cylinder Type</th>
                              <th className="px-3 py-2">Quantity</th>
                              <th className="px-3 py-2">Verification</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {dbData.emptyReturns?.map(r => (
                              <tr key={r.id} className="hover:bg-gray-50/50">
                                <td className="px-3 py-2">{new Date(r.returnDate).toLocaleDateString()}</td>
                                <td className="px-3 py-2 font-semibold">{r.customerName}</td>
                                <td className="px-3 py-2 text-gray-500">{r.cylinderType === 'DOMESTIC_14_2' ? '14.2kg Dom' : '19kg Comm'}</td>
                                <td className="px-3 py-2">{r.quantity}</td>
                                <td className="px-3 py-2">
                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                                    r.verificationStatus === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                  }`}>
                                    {r.verificationStatus}
                                  </span>
                                </td>
                              </tr>
                            ))}
                            {(!dbData.emptyReturns || dbData.emptyReturns.length === 0) && (
                              <tr>
                                <td colSpan="5" className="text-center text-gray-400 py-8">No empty returns found.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* --- TAB 5: DAILY CLOSINGS HISTORY --- */}
            {activeTab === 'closings' && (
              <div>
                <div className="page-header mb-6">
                  <h1 className="text-2xl font-bold text-[#02164F]">Daily Closings Inventory Audits</h1>
                  <p className="text-sm text-gray-500">Historical daily closures logs, physical counts, expected balances, and discrepancies</p>
                </div>

                <div className="bg-white border border-[#E8EAF0] rounded-xl shadow-sm overflow-x-auto">
                  <table className="min-w-full text-xs text-left">
                    <thead className="bg-gray-50 text-gray-700 font-bold uppercase border-b border-[#E8EAF0]">
                      <tr>
                        <th className="px-4 py-3">Closing Date</th>
                        <th className="px-4 py-3">Physical counts (14.2 kg)</th>
                        <th className="px-4 py-3">Physical counts (19 kg)</th>
                        <th className="px-4 py-3">14.2 Mismatches</th>
                        <th className="px-4 py-3">Treasury Cash</th>
                        <th className="px-4 py-3">Lock Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-800">
                      {dbData.dailyClosings?.map(closing => (
                        <tr key={closing.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-semibold">{new Date(closing.closingDate).toLocaleDateString()}</td>
                          <td className="px-4 py-3">F: {closing.physical14Filled} | E: {closing.physical14Empty}</td>
                          <td className="px-4 py-3">F: {closing.physical19Filled} | E: {closing.physical19Empty}</td>
                          <td className="px-4 py-3">
                            <span className={`font-bold ${closing.mismatch14Filled !== 0 || closing.mismatch14Empty !== 0 ? 'text-red-600' : 'text-green-600'}`}>
                              F: {closing.mismatch14Filled} | E: {closing.mismatch14Empty}
                            </span>
                          </td>
                          <td className="px-4 py-3">₹{closing.cashInHand?.toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-green-100 text-green-700">
                              LOCKED
                            </span>
                          </td>
                        </tr>
                      ))}

                      {(!dbData.dailyClosings || dbData.dailyClosings.length === 0) && (
                        <tr>
                          <td colSpan="6" className="text-center text-gray-400 py-12">No daily closing audits recorded.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* --- TAB 6: STAFF CONTROL --- */}
            {activeTab === 'staff' && isAdmin && (
              <div>
                <div className="page-header mb-6">
                  <h1 className="text-2xl font-bold text-[#02164F]">Staff Controls & Registered Profiles</h1>
                  <p className="text-sm text-gray-500">Manage delivery guys and supervisor registrations</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Staff List */}
                  <div className="lg:col-span-2 bg-white border border-[#E8EAF0] rounded-xl p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-[#02164F] mb-4">Active Staff Directory</h3>
                    <div className="space-y-3.5">
                      {dbData.employees?.map(emp => (
                        <div key={emp.id} className="flex justify-between items-center text-xs border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                          <div>
                            <p className="font-bold text-gray-800 text-sm">{emp.name}</p>
                            <p className="text-gray-400 mt-1">Mobile: {emp.mobile || 'N/A'} | Role: {emp.role}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            emp.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                          }`}>
                            {emp.isActive ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Seeded Accounts Reference */}
                  <div className="bg-white border border-[#E8EAF0] rounded-xl p-5 shadow-sm text-xs">
                    <h3 className="text-sm font-bold text-[#02164F] mb-4">Registered IAM Access Roles</h3>
                    <p className="text-gray-500 mb-4">System operates on the three default role profile gates seeded directly in Neon Cloud PostgreSQL. Direct public user signup is blocked.</p>
                    
                    <div className="space-y-3 text-[11px] text-gray-600">
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <p className="font-bold text-[#02164F]">1. Admin Account (MaaSantoshi)</p>
                        <p className="mt-1">Scope: Full database read/write adjustments, EOD stock auditing, and verification approvals queue controls.</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <p className="font-bold text-[#02164F]">2. Employee Account (EmployeeSantoshi)</p>
                        <p className="mt-1">Scope: Field loggings (Domestic/Commercial sales, Connection contracts). Records saved in PENDING state.</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <p className="font-bold text-[#02164F]">3. Auditor Account (AuditorSantoshi)</p>
                        <p className="mt-1">Scope: Read-only access to financial statements, payment histories, and EOD closures. Form controls hidden.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* --- TAB 7: DATA MANAGEMENT (ADMIN ONLY) --- */}
            {activeTab === 'data_management' && isAdmin && (
              <div>
                <div className="page-header mb-6">
                  <h1 className="text-2xl font-bold text-[#02164F]">Data Management & System Audits</h1>
                  <p className="text-sm text-gray-500">Track and manage active load cycles, monthly archives, and ledger resets.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Load Cycle Tracking Section */}
                  <div className="bg-white border border-[#E8EAF0] rounded-xl p-5 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-bold text-[#02164F]">Load Cycle Manager</h3>
                      {!dbData.activeLoadCycle ? (
                        <button
                          type="button"
                          onClick={() => setShowStartCycleModal(true)}
                          className="px-3 py-1.5 bg-[#F37022] text-white text-xs font-semibold rounded-lg hover:bg-[#F37022]/90 transition active:scale-95 flex items-center gap-1.5 animate-fade-in"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Start New Cycle
                        </button>
                      ) : (
                        <span className="bg-green-50 text-green-700 border border-green-200 text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase">
                          Cycle Active
                        </span>
                      )}
                    </div>

                    {dbData.activeLoadCycle ? (
                      <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl mb-4 text-xs">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-bold text-[#02164F] text-sm">Load Cycle #{dbData.activeLoadCycle.loadNumber}</p>
                            <p className="text-gray-400 mt-0.5">Started: {new Date(dbData.activeLoadCycle.loadDate).toLocaleString()}</p>
                          </div>
                          <span className="bg-[#F37022]/10 text-[#F37022] font-bold px-2 py-0.5 rounded capitalize">
                            {dbData.activeLoadCycle.loadType.toLowerCase()} Load
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 border-t border-b border-gray-200/50 py-3 mb-4">
                          <div>
                            <span className="text-gray-400 block mb-0.5">Cylinders Received</span>
                            <strong className="text-base text-[#02164F]">{dbData.activeLoadCycle.cylindersReceived}</strong>
                          </div>
                          <div>
                            <span className="text-gray-400 block mb-0.5">Deliveries Logged</span>
                            <strong className="text-base text-[#02164F]">{dbData.activeLoadCycle.deliveriesCompleted}</strong>
                          </div>
                          <div>
                            <span className="text-gray-400 block mb-0.5">Empty Returns Logged</span>
                            <strong className="text-base text-[#02164F]">{dbData.activeLoadCycle.emptyReturns}</strong>
                          </div>
                          <div>
                            <span className="text-gray-400 block mb-0.5">Status</span>
                            <strong className="text-base text-green-600 font-semibold capitalize">{dbData.activeLoadCycle.status}</strong>
                          </div>
                        </div>
                        <div className="mb-2 text-[11px] text-gray-500">
                          <strong>Opening Stock:</strong> <span className="font-mono">{dbData.activeLoadCycle.openingStock}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setCloseMismatchCount(0);
                            setShowCloseCycleModal(true);
                          }}
                          className="w-full py-2.5 bg-red-50 text-red-600 hover:bg-red-100/80 text-xs font-semibold rounded-xl transition active:scale-95 text-center mt-2 border border-red-200/40"
                        >
                          Close Load Cycle
                        </button>
                      </div>
                    ) : (
                      <div className="p-8 text-center text-gray-400 text-xs bg-gray-50 border border-dashed border-gray-200 rounded-xl mb-4">
                        <Database className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p>No active load cycle. Operations are not linked to a specific delivery vehicle cycle.</p>
                      </div>
                    )}

                    {/* Historical Load Cycles */}
                    <div>
                      <h4 className="text-xs font-bold text-[#02164F] uppercase tracking-wider mb-2 mt-4">Load Cycle Log History</h4>
                      <div className="max-h-[250px] overflow-y-auto border border-[#E8EAF0] rounded-lg">
                        <table className="min-w-full text-left text-xs text-gray-600">
                          <thead className="bg-gray-50 text-[10px] uppercase font-bold text-[#02164F] border-b border-[#E8EAF0]">
                            <tr>
                              <th className="p-2.5">Load #</th>
                              <th className="p-2.5">Type</th>
                              <th className="p-2.5">Date</th>
                              <th className="p-2.5 text-center">Deliv/Ret</th>
                              <th className="p-2.5 text-center">Mismatch</th>
                              <th className="p-2.5">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {dbData.loadCycles?.map(cycle => (
                              <tr key={cycle.id} className="hover:bg-gray-50/50">
                                <td className="p-2.5 font-bold text-[#02164F]">#{cycle.loadNumber}</td>
                                <td className="p-2.5 capitalize">{cycle.loadType.toLowerCase()}</td>
                                <td className="p-2.5">{new Date(cycle.loadDate).toLocaleDateString()}</td>
                                <td className="p-2.5 text-center font-semibold">{cycle.deliveriesCompleted} / {cycle.emptyReturns}</td>
                                <td className="p-2.5 text-center font-bold text-red-600">{cycle.mismatch !== 0 ? cycle.mismatch : '-'}</td>
                                <td className="p-2.5">
                                  <span className={`px-2 py-0.5 rounded-[4px] text-[9px] font-bold uppercase ${
                                    cycle.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                                  }`}>
                                    {cycle.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                            {(!dbData.loadCycles || dbData.loadCycles.length === 0) && (
                              <tr>
                                <td colSpan="6" className="text-center text-gray-400 py-6">No historical cycles recorded.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Monthly Archive & Purging Section */}
                  <div className="bg-white border border-[#E8EAF0] rounded-xl p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-[#02164F] mb-4">Monthly Archive & Purge Manager</h3>
                    
                    {/* Archive form */}
                    <form onSubmit={handleArchiveMonth} className="p-4 bg-gray-50 border border-gray-100 rounded-xl mb-4 text-xs">
                      <h4 className="font-bold text-[#02164F] mb-3">Archive Current Month Operations</h4>
                      <p className="text-gray-500 mb-4 text-[11px] leading-relaxed">
                        Compiles and locks total operational counts, cash inputs, and outstanding debts. This generates a historical month summary sheet prior to triggering database purge resets.
                      </p>

                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="flex flex-col gap-1">
                          <label className="font-semibold text-gray-700">Month</label>
                          <select 
                            value={archiveMonthState}
                            onChange={e => setArchiveMonthState(parseInt(e.target.value))}
                            className="border border-[#E8EAF0] rounded p-2 text-xs focus:border-[#F37022] outline-none bg-white font-semibold text-gray-800"
                          >
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                              <option key={m} value={m}>
                                {new Date(2026, m - 1).toLocaleString('default', { month: 'long' })}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="font-semibold text-gray-700">Year</label>
                          <select 
                            value={archiveYearState}
                            onChange={e => setArchiveYearState(parseInt(e.target.value))}
                            className="border border-[#E8EAF0] rounded p-2 text-xs focus:border-[#F37022] outline-none bg-white font-semibold text-gray-800"
                          >
                            {[2024, 2025, 2026, 2027, 2028].map(y => (
                              <option key={y} value={y}>{y}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-2.5 bg-[#02164F] text-white hover:bg-[#02164F]/90 text-xs font-semibold rounded-xl transition active:scale-95 text-center flex justify-center items-center gap-1.5"
                      >
                        {isSubmitting ? 'Archiving...' : 'Create Monthly Archive Summary'}
                      </button>
                    </form>

                    {/* Historical monthly archives list */}
                    <div>
                      <h4 className="text-xs font-bold text-[#02164F] uppercase tracking-wider mb-2">Historical Monthly Summaries</h4>
                      <div className="max-h-[250px] overflow-y-auto border border-[#E8EAF0] rounded-lg">
                        <table className="min-w-full text-left text-xs text-gray-600">
                          <thead className="bg-gray-50 text-[10px] uppercase font-bold text-[#02164F] border-b border-[#E8EAF0]">
                            <tr>
                              <th className="p-2.5">Month/Year</th>
                              <th className="p-2.5">Deliveries</th>
                              <th className="p-2.5">Cash Received</th>
                              <th className="p-2.5">Created By</th>
                              <th className="p-2.5 text-right">Reset / Purge</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {dbData.monthlyArchives?.map(archive => (
                              <tr key={archive.id} className="hover:bg-gray-50/50">
                                <td className="p-2.5 font-bold text-[#02164F]">
                                  {new Date(archive.year, archive.month - 1).toLocaleString('default', { month: 'short' })} {archive.year}
                                </td>
                                <td className="p-2.5 font-medium">{archive.totalDeliveries}</td>
                                <td className="p-2.5 font-medium">₹{archive.totalCashReceived?.toLocaleString()}</td>
                                <td className="p-2.5 text-gray-400">{archive.createdBy}</td>
                                <td className="p-2.5 text-right">
                                  <button
                                    type="button"
                                    onClick={() => setShowArchiveConfirm(archive)}
                                    className="px-2 py-1 bg-red-50 text-red-600 border border-red-200/40 text-[10px] font-bold rounded hover:bg-red-100 transition"
                                  >
                                    Reset DB
                                  </button>
                                </td>
                              </tr>
                            ))}
                            {(!dbData.monthlyArchives || dbData.monthlyArchives.length === 0) && (
                              <tr>
                                <td colSpan="5" className="text-center text-gray-400 py-6">No historical archives generated.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* VERIFY QUEUE APPROVAL EDIT POPUP MODAL OVERLAY */}
      {verifyingItem && (
        <div className="fixed inset-0 bg-[#02164F]/35 backdrop-blur-sm flex items-center justify-center z-[999] p-4">
          <div className="bg-white rounded-xl border border-[#E8EAF0] shadow-xl p-6 max-w-md w-full">
            <h3 className="text-base font-bold text-[#02164F] mb-2">Review & Approve Submission</h3>
            <p className="text-xs text-gray-500 mb-4">Modify any incorrect data before approving this entry into the active ledger.</p>

            <div className="space-y-3 text-xs">
              {verifyingItem.type === 'DELIVERY' && (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="font-semibold text-gray-700">Quantity Delivered</label>
                    <input 
                      type="number" 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none"
                      value={correctedValues.quantityDelivered} 
                      onChange={e => setCorrectedValues(prev => ({ ...prev, quantityDelivered: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-semibold text-gray-700">Empties Returned</label>
                    <input 
                      type="number" 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none"
                      value={correctedValues.emptyReturned} 
                      onChange={e => setCorrectedValues(prev => ({ ...prev, emptyReturned: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-semibold text-gray-700">Rate per Cylinder</label>
                    <input 
                      type="number" 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none"
                      value={correctedValues.ratePerCylinder} 
                      onChange={e => setCorrectedValues(prev => ({ ...prev, ratePerCylinder: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-semibold text-gray-700">Amount Received (INR)</label>
                    <input 
                      type="number" 
                      className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none"
                      value={correctedValues.amountReceived} 
                      onChange={e => setCorrectedValues(prev => ({ ...prev, amountReceived: e.target.value }))}
                    />
                  </div>
                </>
              )}

              {verifyingItem.type === 'CONNECTION' && (
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-gray-700">Amount Paid (INR)</label>
                  <input 
                    type="number" 
                    className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none"
                    value={correctedValues.amountPaid} 
                    onChange={e => setCorrectedValues(prev => ({ ...prev, amountPaid: e.target.value }))}
                  />
                </div>
              )}

              {verifyingItem.type === 'EMPTY_RETURN' && (
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-gray-700">Quantity Returned</label>
                  <input 
                    type="number" 
                    className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none"
                    value={correctedValues.quantity} 
                    onChange={e => setCorrectedValues(prev => ({ ...prev, quantity: e.target.value }))}
                  />
                </div>
              )}

              {verifyingItem.type === 'PAYMENT' && (
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-gray-700">Amount Paid (INR)</label>
                  <input 
                    type="number" 
                    className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none"
                    value={correctedValues.amount} 
                    onChange={e => setCorrectedValues(prev => ({ ...prev, amount: e.target.value }))}
                  />
                </div>
              )}

              {verifyingItem.type === 'INCIDENT' && (
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-gray-700">Quantity Affected</label>
                  <input 
                    type="number" 
                    className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none"
                    value={correctedValues.quantity} 
                    onChange={e => setCorrectedValues(prev => ({ ...prev, quantity: e.target.value }))}
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2.5 mt-6">
              <button 
                type="button" 
                onClick={() => setVerifyingItem(null)}
                className="flex-1 py-2 bg-white border border-[#E8EAF0] rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={submitApprove}
                className="flex-1 py-2 bg-[#02164F] text-white rounded-lg text-xs font-semibold hover:bg-[#02164F]/90 transition"
              >
                Verify & Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VERIFY QUEUE REJECTION MODAL OVERLAY */}
      {rejectingItem && (
        <div className="fixed inset-0 bg-[#02164F]/35 backdrop-blur-sm flex items-center justify-center z-[999] p-4">
          <div className="bg-white rounded-xl border border-[#E8EAF0] shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-base font-bold text-red-700 mb-2">Reject Submission</h3>
            <p className="text-xs text-gray-500 mb-4">Please provide a short reason for rejecting this employee submission.</p>

            <textarea 
              placeholder="e.g. Incorrect quantity or customer details"
              className="w-full border border-[#E8EAF0] rounded p-2 text-xs h-20 focus:border-red-500 outline-none"
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
            />

            <div className="flex gap-2.5 mt-6">
              <button 
                type="button" 
                onClick={() => setRejectingItem(null)}
                className="flex-1 py-2 bg-white border border-[#E8EAF0] rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={submitReject}
                disabled={!rejectionReason.trim()}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition disabled:opacity-50 disabled:pointer-events-none"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INLINE COMMERCIAL CUSTOMER CREATION MODAL */}
      {showCommercialCustomerModal && (
        <div className="fixed inset-0 bg-[#02164F]/35 backdrop-blur-sm flex items-center justify-center z-[999] p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-[#E8EAF0] shadow-xl p-6 max-w-md w-full">
            <h3 className="text-base font-bold text-[#02164F] mb-1">Add New Commercial Customer</h3>
            <p className="text-xs text-gray-500 mb-4">Register a new commercial business profile directly to the ledger.</p>

            <div className="space-y-3 text-xs max-h-[360px] overflow-y-auto pr-1">
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-gray-700">Company / Business Name*</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Hotel Grand Plaza"
                  className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none"
                  value={newCommercialCustomer.name} 
                  onChange={e => setNewCommercialCustomer(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-gray-700">Contact Person</label>
                <input 
                  type="text" 
                  placeholder="e.g. Manager Singh"
                  className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none"
                  value={newCommercialCustomer.contactPerson} 
                  onChange={e => setNewCommercialCustomer(prev => ({ ...prev, contactPerson: e.target.value }))}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-gray-700">Mobile Number</label>
                <input 
                  type="text" 
                  placeholder="e.g. 9876543210"
                  className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none"
                  value={newCommercialCustomer.mobile} 
                  onChange={e => setNewCommercialCustomer(prev => ({ ...prev, mobile: e.target.value }))}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-gray-700">Business Address</label>
                <input 
                  type="text" 
                  placeholder="e.g. Town Square Plaza"
                  className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none"
                  value={newCommercialCustomer.address} 
                  onChange={e => setNewCommercialCustomer(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-gray-700">GSTIN (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. 10AAAAA0000A1Z0"
                  className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none font-mono"
                  value={newCommercialCustomer.gstin} 
                  onChange={e => setNewCommercialCustomer(prev => ({ ...prev, gstin: e.target.value }))}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-gray-700">Customer Category</label>
                <select 
                  className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none bg-white"
                  value={newCommercialCustomer.category} 
                  onChange={e => setNewCommercialCustomer(prev => ({ ...prev, category: e.target.value }))}
                >
                  <option value="Hotel">Hotel</option>
                  <option value="Restaurant">Restaurant</option>
                  <option value="Institution">Institution</option>
                  <option value="Shop">Shop</option>
                  <option value="Industrial">Industrial</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-gray-700">Opening Outstanding Debt (INR)</label>
                <input 
                  type="number" 
                  min="0"
                  placeholder="e.g. 5000"
                  className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none font-semibold text-red-600"
                  value={newCommercialCustomer.openingOutstanding} 
                  onChange={e => setNewCommercialCustomer(prev => ({ ...prev, openingOutstanding: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-2.5 mt-6 border-t border-gray-100 pt-4">
              <button 
                type="button" 
                onClick={() => setShowCommercialCustomerModal(false)}
                className="flex-1 py-2.5 bg-white border border-[#E8EAF0] rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 transition active:scale-95"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleCreateCommercialCustomer}
                disabled={!newCommercialCustomer.name.trim() || isSubmitting}
                className="flex-1 py-2.5 bg-[#F37022] text-white rounded-xl text-xs font-semibold hover:bg-[#F37022]/90 transition active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
              >
                {isSubmitting ? 'Saving...' : 'Save & Select'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* START LOAD CYCLE MODAL */}
      {showStartCycleModal && (
        <div className="fixed inset-0 bg-[#02164F]/35 backdrop-blur-sm flex items-center justify-center z-[999] p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-[#E8EAF0] shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-base font-bold text-[#02164F] mb-1">Start New Load Cycle</h3>
            <p className="text-xs text-gray-500 mb-4">Initialize tracking for a new vehicle load arrival.</p>

            <form onSubmit={handleStartLoadCycle} className="space-y-3 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-gray-700">Load/Challan Number*</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. MS-L-4589"
                  className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none"
                  value={newLoadNumber} 
                  onChange={e => setNewLoadNumber(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-gray-700">Load Category</label>
                <select 
                  className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none bg-white"
                  value={newLoadType} 
                  onChange={e => setNewLoadType(e.target.value)}
                >
                  <option value="MIXED">Mixed Load</option>
                  <option value="DOMESTIC">Domestic Only</option>
                  <option value="COMMERCIAL">Commercial Only</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-gray-700">Cylinders Received Count*</label>
                <input 
                  type="number" 
                  required
                  min="1"
                  className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none"
                  value={newCylindersReceived} 
                  onChange={e => setNewCylindersReceived(parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="flex gap-2.5 mt-6 border-t border-gray-100 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowStartCycleModal(false)}
                  className="flex-1 py-2.5 bg-white border border-[#E8EAF0] rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 transition active:scale-95"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={!newLoadNumber.trim() || isSubmitting}
                  className="flex-1 py-2.5 bg-[#F37022] text-white rounded-xl text-xs font-semibold hover:bg-[#F37022]/90 transition active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isSubmitting ? 'Starting...' : 'Start Cycle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLOSE LOAD CYCLE WITH MISMATCH PROMPT MODAL */}
      {showCloseCycleModal && dbData.activeLoadCycle && (
        <div className="fixed inset-0 bg-[#02164F]/35 backdrop-blur-sm flex items-center justify-center z-[999] p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-[#E8EAF0] shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-base font-bold text-[#02164F] mb-1">Close Active Load Cycle</h3>
            <p className="text-xs text-gray-500 mb-4">
              Close load tracking cycle for <strong>#{dbData.activeLoadCycle.loadNumber}</strong>. Enter any observed cylinder mismatches.
            </p>

            <div className="space-y-3 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-gray-700">Observed Physical Mismatch (Cylinders)</label>
                <input 
                  type="number" 
                  placeholder="e.g. -2 for shortage, 0 for clear"
                  className="border border-[#E8EAF0] rounded p-2 text-sm focus:border-[#F37022] outline-none"
                  value={closeMismatchCount} 
                  onChange={e => setCloseMismatchCount(parseInt(e.target.value) || 0)}
                />
                <span className="text-[10px] text-gray-400">
                  Enter negative integers for cylinder shortages, positive for extra.
                </span>
              </div>

              <div className="flex gap-2.5 mt-6 border-t border-gray-100 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowCloseCycleModal(false)}
                  className="flex-1 py-2.5 bg-white border border-[#E8EAF0] rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 transition active:scale-95"
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  onClick={handleCloseLoadCycle}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700 transition active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? 'Closing...' : 'Close & Lock'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM ARCHIVE DATA PURGE RESET MODAL */}
      {showArchiveConfirm && (
        <div className="fixed inset-0 bg-[#02164F]/35 backdrop-blur-sm flex items-center justify-center z-[999] p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-[#E8EAF0] shadow-xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
              <h3 className="text-base font-bold text-[#02164F]">Purge Operational Logs</h3>
            </div>
            
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Are you absolutely sure you want to permanently delete all detailed transaction logs for the month of{' '}
              <strong>
                {new Date(showArchiveConfirm.year, showArchiveConfirm.month - 1).toLocaleString('default', { month: 'long' })}{' '}
                {showArchiveConfirm.year}
              </strong>
              ? This action will free up database storage and cannot be undone. The aggregated monthly archive itself will be preserved.
            </p>

            <div className="flex gap-2.5 mt-6 border-t border-gray-100 pt-4">
              <button 
                type="button" 
                onClick={() => setShowArchiveConfirm(null)}
                className="flex-1 py-2.5 bg-white border border-[#E8EAF0] rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 transition active:scale-95"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={() => handleResetActiveMonth(showArchiveConfirm.id)}
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700 transition active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? 'Purging...' : 'Confirm Purge'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
