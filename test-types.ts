import { supabase } from './lib/supabase/client';

async function test() {
    const { data } = await supabase.from('weddings').select('*');
    // @ts-expect-error - testing if data is any or never
    const x: number = data;
}
