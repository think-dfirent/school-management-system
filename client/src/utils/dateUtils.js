/* *
 * Standardizes date formatting to Vietnamese format: DD/MM/YYYY
 * Handles ISO strings, timestamps, and Date objects.
 *
 * @param {string|Date|number} dateInput - The date to be formatted
 * @returns {string} - Formatted date string (e.g., "09/07/2026") */
export const formatDateVN = (dateInput) => {
  if (!dateInput) return "";
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "";

    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();

    return `${day}/${month}/${year}`;
  } catch (error) {
    return "";
  }
};

/* *
 * Formats a Mongo/ISO date string to YYYY-MM-DD for native HTML5 date inputs
 *
 * @param {string|Date} dateInput - The date to format
 * @returns {string} - Date input value formatted as "YYYY-MM-DD" */
export const formatForDateInput = (dateInput) => {
  if (!dateInput) return "";
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "";

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  } catch (error) {
    return "";
  }
};
