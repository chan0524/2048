// src/fetchRanking.js
import supabase from './supabaseClient';

export const fetchRanking = async () => {
  const { data, error } = await supabase
    .from('scores')
    .select('*')
    .order('score', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Fetch ranking error:', error.message);
    return [];
  }

  return data;
};
