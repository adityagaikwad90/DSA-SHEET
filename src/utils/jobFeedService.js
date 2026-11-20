import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../firebase';

const functions = getFunctions(app, 'us-central1');
const fetchOpenings = httpsCallable(functions, 'getLiveJobOpenings');

export async function getLiveJobOpenings() {
  const response = await fetchOpenings();
  return {
    jobs: Array.isArray(response.data?.jobs) ? response.data.jobs : [],
    updatedAt: response.data?.updatedAt || null,
  };
}
