// Best-effort User-Agent + Client Hint parser. No extra dependency.
// Device model comes from Sec-CH-UA-Model or navigator.userAgentData (client).
// A visitor's name is never present in any of these signals.
export function parseUA(ua, hints = {}) {
  const u = String(ua || "");
  const mobileHint = hints.mobile;
  let device_type = "desktop";
  if (/iPad|Tablet|PlayBook|Silk/i.test(u) || (mobileHint === false && /Android/i.test(u))) device_type = "tablet";
  else if (mobileHint === true || /Mobi|iPhone|iPod|Android.+Mobile|webOS|IEMobile|BlackBerry/i.test(u)) device_type = "mobile";

  let os = clean(hints.platform) || "Unknown";
  if (os === "Unknown") {
    if (/Windows NT/i.test(u)) os = "Windows";
    else if (/CrOS/i.test(u)) os = "Chrome OS";
    else if (/iPhone|iPad|iPod/i.test(u)) os = "iOS";
    else if (/Mac OS X|Macintosh/i.test(u)) os = "macOS";
    else if (/Android/i.test(u)) os = "Android";
    else if (/Linux/i.test(u)) os = "Linux";
  }
  const os_ver = clean(hints.platformVersion);

  let browser = "Unknown";
  const brands = hints.brands || "";
  if (brands) {
    const first = brands.split(",").map((s) => s.trim()).find((s) => s && !/Not.?A.?Brand/i.test(s));
    if (first) browser = first.replace(/\s+\d[\d.]*/, "").trim() || first;
  }
  if (browser === "Unknown") {
    if (/Edg\//.test(u)) browser = "Edge";
    else if (/OPR\/|Opera/i.test(u)) browser = "Opera";
    else if (/SamsungBrowser/i.test(u)) browser = "Samsung Internet";
    else if (/Firefox\//.test(u)) browser = "Firefox";
    else if (/CriOS\//.test(u)) browser = "Chrome";
    else if (/Chrome\//.test(u)) browser = "Chrome";
    else if (/Safari\//.test(u) && !/Chrome\//.test(u)) browser = "Safari";
  }

  const device_model = clean(hints.model);
  return { device_type, device_model, browser, os, os_ver };
}

function clean(s) {
  if (s == null) return "";
  return String(s).replace(/^"+|"+$/g, "").trim().slice(0, 80);
}
