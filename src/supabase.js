import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  "https://iwxudvcsfffvdiujnlew.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3eHVkdmNzZmZmdmRpdWpubGV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2NTkxODYsImV4cCI6MjA5NTIzNTE4Nn0.dasix16jVf0wa5XRu1bUyon4_Zf20DGr8pJ7OLfn6Dw"
)