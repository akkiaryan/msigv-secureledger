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
    <div className="relative bg-white rounded-2xl border border-[#E8EAF0] shadow-sm p-6 mb-8 max-w-2xl mx-auto transition-all duration-200">
      {/* Header */}
      <div className="flex justify-between items-start border-b border-[#E8EAF0] pb-4 mb-6">
        <div>
          <h3 className="text-xl font-bold text-[#02164F]">{title}</h3>
          <p className="text-sm text-[#6B7280] mt-1">{subtitle}</p>
        </div>
        {onClose && (
          <button 
            type="button" 
            onClick={onClose} 
            className="p-1 rounded-lg text-[#9CA3AF] hover:text-[#111827] hover:bg-[#F7F8FA] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Success State Overlay */}
      {successData ? (
        <div className="py-8 px-4 text-center animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#16A34A]/10 text-[#16A34A] mb-4">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h4 className="text-2xl font-bold text-[#111827] mb-2">Record Registered Successfully!</h4>
          <p className="text-[#6B7280] max-w-md mx-auto mb-6">
            {successData.message || "Your entry has been processed and logged."}
          </p>

          {/* Printable Receipt Preview Box */}
          <div id="printable-receipt" className="border border-[#E8EAF0] rounded-xl p-6 bg-[#F7F8FA] max-w-md mx-auto text-left shadow-sm mb-8 print:border-0 print:shadow-none print:bg-white print:p-0">
            {/* IOCL Header style */}
            <div className="flex items-center gap-3 border-b border-[#E8EAF0] pb-4 mb-4">
              <img src="/logo.svg" alt="IOCL Logo" className="w-10 h-11 object-contain" />
              <div>
                <h5 className="font-bold text-[#02164F] text-sm leading-tight">Maa Santoshi Indane Gramin Vitrak</h5>
                <p className="text-[9px] text-[#6B7280] mt-0.5">SDMS ID: MSIGV-LPG-717 | Security Slip</p>
              </div>
            </div>

            {/* Receipt Attributes */}
            <div className="space-y-2.5 text-xs text-[#111827]">
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Receipt ID:</span>
                <span className="font-mono font-semibold">{successData.id || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Timestamp:</span>
                <span>{new Date().toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Transaction:</span>
                <span className="font-semibold">{title}</span>
              </div>
              
              {/* Detailed custom items */}
              {successData.details && Object.entries(successData.details).map(([key, val]) => (
                <div key={key} className="flex justify-between border-t border-[#E8EAF0]/50 pt-1.5 mt-1.5">
                  <span className="text-[#6B7280] capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                  <span className="font-semibold">{val}</span>
                </div>
              ))}

              <div className="border-t border-[#E8EAF0] pt-3 mt-3 flex justify-between items-center">
                <span className="text-[#6B7280] font-medium">Verification Status:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  successData.status === 'PENDING' 
                    ? 'bg-[#F59E0B]/10 text-[#F59E0B]' 
                    : 'bg-[#16A34A]/10 text-[#16A34A]'
                }`}>
                  {successData.status || "APPROVED"}
                </span>
              </div>
            </div>

            <div className="text-center text-[10px] text-[#9CA3AF] mt-6 border-t border-dashed border-[#E8EAF0] pt-4">
              Thank you for choosing Indane. This is a computer generated ledger slip.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={triggerPrint}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#02164F] text-white text-sm font-semibold rounded-lg hover:bg-[#02164F]/90 active:scale-95 transition-all shadow-sm"
            >
              <Printer className="w-4 h-4" /> Print Receipt
            </button>
            <button
              onClick={onReset}
              className="px-5 py-2.5 bg-white border border-[#E8EAF0] text-[#111827] text-sm font-semibold rounded-lg hover:bg-[#F7F8FA] active:scale-95 transition-all"
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
            <div className="bg-[#F7F8FA] rounded-xl border border-[#E8EAF0] p-4 flex gap-3 items-start">
              <AlertCircle className="w-5 h-5 text-[#02164F] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-[#02164F] uppercase tracking-wider mb-1">Operational Guidelines</h4>
                <ul className="list-disc list-inside text-xs text-[#6B7280] space-y-1">
                  {instructions.map((inst, idx) => (
                    <li key={idx}>{inst}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Form Content Fields */}
          <div className="form-content-area">
            {children}
          </div>

          {/* Sticky Actions Bar for Mobile & Clean Layout for Desktop */}
          <div className="border-t border-[#E8EAF0] pt-4 mt-6 flex justify-end gap-3 sticky bottom-0 bg-white/95 backdrop-blur-sm py-2">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-white border border-[#E8EAF0] text-[#6B7280] text-sm font-semibold rounded-lg hover:text-[#111827] hover:bg-[#F7F8FA] transition-all"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-[#F37022] hover:bg-[#F37022]/90 text-white text-sm font-semibold rounded-lg transition-all active:scale-95 shadow-sm disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSubmitting ? "Processing..." : "Verify & Submit"}
            </button>
          </div>
        </form>
      )}

      {/* Double Confirmation Modal Overlay */}
      {showConfirm && (
        <div className="fixed inset-0 bg-[#02164F]/30 backdrop-blur-sm flex items-center justify-center z-[999] p-4 animate-fade-in">
          <div className="bg-white rounded-xl border border-[#E8EAF0] shadow-xl p-6 max-w-sm w-full text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#F59E0B]/10 text-[#F59E0B] mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-[#111827] mb-1">{confirmTitle}</h4>
            <p className="text-xs text-[#6B7280] mb-6">{confirmMessage}</p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2 bg-white border border-[#E8EAF0] text-xs font-semibold text-[#6B7280] rounded-lg hover:text-[#111827] hover:bg-[#F7F8FA] transition-all"
              >
                Back to Edit
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                className="flex-1 py-2 bg-[#F37022] text-xs font-semibold text-white rounded-lg hover:bg-[#F37022]/90 transition-all active:scale-95 shadow-sm"
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
