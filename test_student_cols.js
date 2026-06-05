const { createClient } = require('@supabase/supabase-js')
const supabaseUrl = 'https://wbypylvyzbeglwpsrwuo.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndieXB5bHZ5emJlZ2x3cHNyd3VvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzU4NDc4NCwiZXhwIjoyMDc5MTYwNzg0fQ.I3lWM1xXToVW_PEQwonVvDR-bCVGjGEn6KmKwflNySo'
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data, error } = await supabase.from('students').insert({firstname:'A', lastname:'B'}).select()
  if (data && data.length) {
    console.log(Object.keys(data[0]))
    await supabase.from('students').delete().eq('id', data[0].id)
  } else {
    console.log(error)
  }
}
run()
