const DEFAULT_ENDPOINT = import.meta.env?.VITE_OBJECT_STORAGE_BASE_URL;

export const uploadEvidenceImage = async (file, endpoint = DEFAULT_ENDPOINT) => {
  if (!file) {
    return null;
  }

  if (!endpoint) {
    throw new Error('Evidence upload endpoint is not configured');
  }

  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`${endpoint}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload evidence image');
  }

  const data = await response.json();
  const location = data?.file?.location;

  if (!location) {
    throw new Error('Evidence upload did not return a file URL');
  }

  return location;
};

export default uploadEvidenceImage;
