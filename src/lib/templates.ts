export const DOCUMENT_TEMPLATES = {
  EVENT_PERMISSION: {
    id: "EVENT_PERMISSION",
    title: "Event Approval & Venue Booking",
    fields: ["eventName", "date", "venue", "budget", "facultyCoordinator"],
  },
  ON_DUTY_LEAVE: {
    id: "ON_DUTY_LEAVE",
    title: "On-Duty (OD) Leave Application",
    fields: ["studentName", "rollNumber", "datesOfLeave", "reason", "eventOrHackathonName"],
  },
  REIMBURSEMENT: {
    id: "REIMBURSEMENT",
    title: "Expense Reimbursement Claim",
    fields: ["vendorName", "totalAmount", "dateOfPurchase", "purposeOfExpense"],
  },
} as const;

export type DocumentIntent = keyof typeof DOCUMENT_TEMPLATES;