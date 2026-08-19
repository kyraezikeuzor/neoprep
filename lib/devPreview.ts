/**
 * Lets local development show the enrolled-student experience without a
 * Supabase session. This is never enabled in a production build.
 */
export const isLocalStudentPreview = process.env.NODE_ENV === "development";
