// Function to format date for display
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  
  // Log the raw date string for debugging
  console.log(`Raw date from database: ${dateStr} (type: ${typeof dateStr})`);
  
  try {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString(undefined, options);
  } catch (err) {
    console.error("Date formatting error:", err);
    return dateStr; // If parsing fails, return the original string
  }
}; 