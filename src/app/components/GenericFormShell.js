'use client';

import React, { useState } from 'react';
import { CheckCircle, AlertTriangle, Printer, Download, X, AlertCircle } from 'lucide-react';

export default function GenericFormShell({
  title,
  subtitle,
  instructions = [],
  onSubmit,
  isSubmitting,
  successData,
  onReset,
  onClose,
  confirmTitle = "Are you sure?",
  confirmMessage = "Please double check all fields before submitting.",
  children
}) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmitClick = (e) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  const handleConfirmSubmit = () => {
    setShowConfirm(false);
    onSubmit();
  };

  const triggerPrint = () => {
    window.print();
  };

  // Modern White Dashboard style wrappers
  return (
    <div className="relative bg-white rounded-[4px] border border-[#D6DEE8] p-6 mb-8 max-w-2xl mx-auto transition-all duration-200">
      {/* Header */}
      <div className="flex justify-between items-start border-b border-[#D6DEE8] pb-4 mb-6">
        <div>
          <h3 className="text-xl font-bold text-[#001F5B] uppercase tracking-wide">{title}</h3>
          <p className="text-xs text-gray-600 mt-1">{subtitle}</p>
        </div>
        {onClose && (
          <button 
            type="button" 
            onClick={onClose} 
            className="p-1 rounded-[4px] text-[#9CA3AF] hover:text-[#111827] hover:bg-gray-50 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Success State Overlay */}
      {successData ? (
        <div className="py-8 px-4 text-center animate-fade-in">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-700 mb-4">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h4 className="text-xl font-bold text-gray-800 mb-2">Record Registered Successfully!</h4>
          <p className="text-xs text-gray-500 max-w-md mx-auto mb-6">
            {successData.message || "Your entry has been processed and logged."}
          </p>

          {/* Printable Receipt Preview Box */}
          <div id="printable-receipt" className="printable-area border border-[#D6DEE8] rounded-[4px] p-6 bg-gray-50 max-w-md mx-auto text-left shadow-none mb-6 print:border-0 print:bg-white print:p-0">
            {/* IOCL Header style */}
            <div className="flex items-center gap-3 border-b border-[#D6DEE8] pb-4 mb-4">
              <img src="/logo.svg" alt="IOCL Logo" className="w-8 h-9 object-contain" />
              <div>
                <h5 className="font-bold text-[#001F5B] text-xs leading-tight">Maa Santoshi Indane Gramin Vitrak</h5>
                <p className="text-[9px] text-gray-500 mt-0.5">SDMS ID: MSIGV-LPG-717 | Security Slip</p>
              </div>
            </div>

            {/* Receipt Attributes */}
            <div className="space-y-2 text-xs text-gray-800">
              <div className="flex justify-between">
                <span className="text-gray-500">Receipt ID:</span>
                <span className="font-mono font-semibold">{successData.id || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Timestamp:</span>
                <span>{new Date().toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Transaction:</span>
                <span className="font-semibold">{title}</span>
              </div>
              
              {/* Detailed custom items */}
              {successData.details && Object.entries(successData.details).map(([key, val]) => (
                <div key={key} className="flex justify-between border-t border-[#D6DEE8]/50 pt-1.5 mt-1.5">
                  <span className="text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                  <span className="font-semibold">{val}</span>
                </div>
              ))}

              <div className="border-t border-[#D6DEE8] pt-3 mt-3 flex justify-between items-center">
                <span className="text-gray-500 font-medium">Verification Status:</span>
                <span className={`px-2 py-0.5 rounded-[2px] text-[10px] font-bold uppercase border ${
                  successData.status === 'PENDING' 
                    ? 'bg-yellow-100 text-yellow-700 border-yellow-200' 
                    : 'bg-green-100 text-green-700 border-green-200'
                }`}>
                  {successData.status || "APPROVED"}
                </span>
              </div>
            </div>

            <div className="text-center text-[9px] text-gray-400 mt-6 border-t border-dashed border-[#D6DEE8] pt-4">
              Thank you for choosing Indane. This is a computer generated ledger slip.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={triggerPrint}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#001F5B] text-white text-xs font-bold rounded-[4px] hover:bg-[#00143A] transition shadow-none"
            >
              <Printer className="w-3.5 h-3.5" /> Print Receipt
            </button>
            <button
              onClick={onReset}
              className="px-4 py-2 bg-white border border-[#D6DEE8] text-gray-700 text-xs font-bold rounded-[4px] hover:bg-gray-50 transition"
            >
              Submit Another Entry
            </button>
          </div>
        </div>
      ) : (
        /* Form State */
        <form onSubmit={handleSubmitClick} className="space-y-6">
          {/* Instructions Box */}
          {instructions.length > 0 && (
            <div className="bg-gray-50 rounded-[4px] border border-[#D6DEE8] p-4 flex gap-3 items-start">
              <AlertCircle className="w-4 h-4 text-[#001F5B] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-[10px] font-bold text-[#001F5B] uppercase tracking-wider mb-1">Operational Guidelines</h4>
                <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                  {instructions.map((inst, idx) => (
                    <li key={idx}>{inst}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Form Content Fields */}
          <div className="space-y-6">
            {children}
          </div>

          {/* Actions Bar */}
          <div className="border-t border-[#D6DEE8] pt-4 mt-6 flex justify-end gap-3 bg-white">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white border border-[#D6DEE8] text-gray-700 text-xs font-bold rounded-[4px] hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-[#F37022] hover:bg-[#D9540C] text-white text-xs font-bold rounded-[4px] transition disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSubmitting ? "Processing..." : "Verify & Submit"}
            </button>
          </div>
        </form>
      )}

      {/* Double Confirmation Modal Overlay */}
      {showConfirm && (
        <div className="fixed inset-0 bg-[#001F5B]/30 backdrop-blur-sm flex items-center justify-center z-[999] p-4 animate-fade-in">
          <div className="bg-white rounded-[4px] border border-[#D6DEE8] p-6 max-w-sm w-full text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-yellow-50 text-yellow-600 mb-4 border border-yellow-100">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-gray-800 mb-1">{confirmTitle}</h4>
            <p className="text-xs text-gray-500 mb-6">{confirmMessage}</p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2 bg-white border border-[#D6DEE8] text-xs font-bold text-gray-700 rounded-[4px] hover:bg-gray-50 transition"
              >
                Back to Edit
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                className="flex-1 py-2 bg-[#F37022] text-xs font-bold text-white rounded-[4px] hover:bg-[#D9540C] transition"
              >
                Yes, Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
