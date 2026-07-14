// Clean up invalid CLOUDINARY_URL and other config from process.env immediately on load to prevent Cloudinary SDK from crashing
if (process.env.CLOUDINARY_URL !== undefined) {
  let url = process.env.CLOUDINARY_URL.trim();
  // Strip any surrounding single or double quotes
  if (url.startsWith('"') && url.endsWith('"')) {
    url = url.slice(1, -1).trim();
  } else if (url.startsWith("'") && url.endsWith("'")) {
    url = url.slice(1, -1).trim();
  }
  
  if (url === '' || !url.toLowerCase().startsWith('cloudinary://')) {
    console.warn(`[Cloudinary Sanitize] Invalid CLOUDINARY_URL detected. Removing to prevent server crash.`);
    delete process.env.CLOUDINARY_URL;
  } else {
    // Save the completely cleaned and trimmed URL back to process.env.CLOUDINARY_URL
    process.env.CLOUDINARY_URL = url;
    
    // Also, proactively extract separate components to ensure they exist and are clean
    try {
      const remaining = url.substring('cloudinary://'.length);
      const [authPart, cloudName] = remaining.split('@');
      if (authPart && cloudName) {
        const [apiKey, apiSecret] = authPart.split(':');
        if (apiKey && apiSecret && cloudName) {
          process.env.CLOUDINARY_CLOUD_NAME = cloudName.trim();
          process.env.CLOUDINARY_API_KEY = apiKey.trim();
          process.env.CLOUDINARY_API_SECRET = apiSecret.trim();
        }
      }
    } catch (err) {
      console.warn('[Cloudinary Sanitize] Could not extract pieces from URL:', err);
    }
  }
}

// Clean up individual variables if they are present
['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET', 'CLOUDINARY_UPLOAD_PRESET'].forEach(key => {
  if (process.env[key] !== undefined) {
    let val = process.env[key]!.trim();
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.slice(1, -1).trim();
    } else if (val.startsWith("'") && val.endsWith("'")) {
      val = val.slice(1, -1).trim();
    }
    if (val === '') {
      delete process.env[key];
    } else {
      process.env[key] = val;
    }
  }
});
