import axios from 'axios';

const MAPPLS_AUTH_URL = "https://outpost.mappls.com/api/security/oauth/token";
const MAPPLS_SUGGEST_URL = "https://atlas.mappls.com/api/places/atlas/v1/autosuggest";

export const getAutosuggestions = async (query, token) => {
  if (!query || query.length < 3) return [];
  
  try {
    const res = await axios.get(MAPPLS_SUGGEST_URL, {
      params: { query, region: "IND" },
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data.suggestedLocations || [];
  } catch (err) {
    console.error("Mappls Autosuggest Error", err);
    return [];
  }
};