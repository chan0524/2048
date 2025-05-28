import supabase from './SupabaseClient'

export const submitScore = async (nickname, score) => {
  const { data, error } = await supabase.from('scores').insert([
    { nickname, score }
  ]);

  if (error) {
    console.error('Score submit error:', error.message);
    return false;
  }

  return true;
};
