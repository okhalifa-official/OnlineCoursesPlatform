const crypto = require("crypto")

const { getPaymentEnv } = require("../config/paymentEnv")

const API_BASE_URLS = {
  test: "https://test-api.kashier.io",
  live: "https://api.kashier.io",
}

function getApiBaseUrl() {
  const env = getPaymentEnv()

  return API_BASE_URLS[env.kashierMode]
}

function ensureFetch() {
  if (typeof fetch !== "function") {
    throw new Error("Global fetch is not available in this Node.js runtime")
  }
}

async function parseKashierResponse(response) {
  const text = await response.text()

  if (!text) {
    return null
  }

  try {
    return JSON.parse(text)
  } catch (error) {
    return { raw: text }
  }
}

async function requestKashier(pathname, options = {}) {
  ensureFetch()

  const env = getPaymentEnv()
  const url = `${getApiBaseUrl()}${pathname}`
  const headers = {
    Authorization: env.kashierSecretKey,
    ...(options.includeApiKey ? { "api-key": env.kashierApiKey } : {}),
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers || {}),
  }

  const response = await fetch(url, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  const payload = await parseKashierResponse(response)

  if (!response.ok) {
    const error = new Error(
      `Kashier request failed with status ${response.status}`
    )

    error.statusCode = response.status
    error.payload = payload

    throw error
  }

  return payload
}

function formatAmount(amount) {
  return Number(amount).toFixed(2)
}

function buildMerchantRedirectUrl(referenceNumber, courseId) {
  const env = getPaymentEnv()
  const redirectUrl = new URL(env.kashierMerchantRedirectUrl)

  redirectUrl.searchParams.set("paymentRef", referenceNumber)
  redirectUrl.searchParams.set("courseId", String(courseId))

  return encodeURIComponent(redirectUrl.toString())
}

function buildEncodedMetadata(metadata) {
  return encodeURIComponent(JSON.stringify(metadata))
}

async function createHostedPaymentSession({
  amount,
  currency,
  courseId,
  courseName,
  referenceNumber,
}) {
  const env = getPaymentEnv()
  const expireAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()

  const payload = {
    expireAt,
    maxFailureAttempts: 3,
    paymentType: "credit",
    amount: formatAmount(amount),
    currency,
    order: referenceNumber,
    merchantRedirect: buildMerchantRedirectUrl(referenceNumber, courseId),
    display: env.kashierDisplayLanguage,
    type: "one-time",
    allowedMethods: env.kashierAllowedMethods,
    redirectMethod: "get",
    failureRedirect: true,
    merchantId: env.kashierMerchantId,
    mode: env.kashierMode,
    serverWebhook: env.kashierServerWebhookUrl,
    metaData: buildEncodedMetadata({
      courseId,
      courseName,
      referenceNumber,
    }),
    description: String(courseName || "Course payment").slice(0, 120),
  }

  const response = await requestKashier("/v3/payment/sessions", {
    method: "POST",
    includeApiKey: true,
    body: payload,
  })

  const sessionId = response?._id || response?.sessionId
  const sessionUrl = response?.sessionUrl

  if (!sessionId || !sessionUrl) {
    throw new Error("Kashier session response is missing session identifiers")
  }

  return {
    expireAt: new Date(response.expireAt || expireAt),
    gatewayStatus: response.status || "CREATED",
    merchantOrderId:
      response?.paymentParams?.order || response?.merchantOrderId || referenceNumber,
    raw: response,
    sessionId,
    sessionUrl,
  }
}

async function getPaymentSession(sessionId) {
  return requestKashier(`/v3/payment/sessions/${encodeURIComponent(sessionId)}/payment`)
}

async function reconcileOrder(referenceNumber) {
  const searchParams = new URLSearchParams()

  searchParams.set("merchantOrderId", referenceNumber)
  searchParams.set("search", referenceNumber)

  return requestKashier(`/v3/payment/orders?${searchParams.toString()}`)
}

function buildWebhookSignaturePayload(data) {
  const signatureKeys = Array.isArray(data?.signatureKeys)
    ? [...data.signatureKeys].sort()
    : []

  return signatureKeys
    .filter((key) => data?.[key] !== undefined && data?.[key] !== null)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(String(data[key]))}`)
    .join("&")
}

function verifyWebhookSignature(payload, receivedSignature) {
  if (!payload?.data || !receivedSignature) {
    return false
  }

  const env = getPaymentEnv()
  const expectedSignature = crypto
    .createHmac("sha256", env.kashierApiKey)
    .update(buildWebhookSignaturePayload(payload.data))
    .digest("hex")

  const receivedBuffer = Buffer.from(String(receivedSignature), "utf8")
  const expectedBuffer = Buffer.from(expectedSignature, "utf8")

  if (receivedBuffer.length !== expectedBuffer.length) {
    return false
  }

  return crypto.timingSafeEqual(receivedBuffer, expectedBuffer)
}

module.exports = {
  createHostedPaymentSession,
  getPaymentSession,
  reconcileOrder,
  verifyWebhookSignature,
}