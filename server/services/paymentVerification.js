const GROQ_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

const EXTRACTION_PROMPT = `You are analyzing a screenshot of an InstaPay (Egyptian instant payment) transaction confirmation.

Extract the following fields as JSON:
{
  "isInstaPayScreenshot": boolean,
  "amount": number or null (numeric value only, no currency symbol),
  "currency": string or null (e.g. "EGP"),
  "recipientHandle": string or null (phone number or handle of the recipient, digits only if phone),
  "recipientName": string or null (name of the recipient as shown),
  "senderName": string or null,
  "transactionTimestamp": string or null (ISO 8601 if possible, else raw as shown),
  "referenceNumber": string or null (transaction reference / ID),
  "status": string or null (e.g. "Successful", "Success", "Completed"),
  "notes": string (a one-line human-readable summary of what you see)
}

Rules:
- Screenshots may be in Arabic or English. Translate field values to English where reasonable but keep names/handles verbatim.
- If a field is not clearly visible, set it to null. Do not guess.
- For recipientHandle, extract digits only if it looks like an Egyptian mobile number (starts with 01 and is 11 digits).
- Return ONLY the JSON object.`;

function requireApiKey() {
  const key = process.env.GROQ_API_KEY;

  if (!key || !String(key).trim()) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  return String(key).trim();
}

function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "");
}

function parseModelJson(text) {
  if (!text) {
    return null;
  }

  const trimmed = String(text).trim();
  const withoutFences = trimmed.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");

  try {
    return JSON.parse(withoutFences);
  } catch (error) {
    const firstBrace = withoutFences.indexOf("{");
    const lastBrace = withoutFences.lastIndexOf("}");

    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(withoutFences.slice(firstBrace, lastBrace + 1));
      } catch (nestedError) {
        return null;
      }
    }

    return null;
  }
}

async function extractScreenshotData({ base64, mimeType }) {
  const apiKey = requireApiKey();

  const dataUrl = `data:${mimeType || "image/jpeg"};base64,${base64}`;

  const response = await fetch(GROQ_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: EXTRACTION_PROMPT },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
    }),
  });

  const payload = await response.json();

  if (!response.ok) {
    const error = new Error(
      `Groq request failed (${response.status}): ${payload?.error?.message || "unknown error"}`
    );

    error.status = response.status;
    error.payload = payload;

    throw error;
  }

  const rawText = payload?.choices?.[0]?.message?.content || "";
  const parsed = parseModelJson(rawText);

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Groq did not return a valid JSON payload");
  }

  return parsed;
}

function runVerificationChecks({
  extracted,
  expectedAmount,
  expectedCurrency,
  expectedRecipientHandle,
  maxAgeMinutes,
}) {
  const checks = [];
  const reasons = [];

  const isInstaPay = Boolean(extracted?.isInstaPayScreenshot);

  checks.push({
    name: "screenshotIsInstaPay",
    passed: isInstaPay,
    detail: isInstaPay ? "Screenshot looks like InstaPay" : "Screenshot doesn't look like an InstaPay confirmation",
  });

  if (!isInstaPay) {
    reasons.push("This does not look like an InstaPay confirmation screenshot.");
  }

  const extractedAmount = Number(extracted?.amount);
  const amountMatches =
    Number.isFinite(extractedAmount) &&
    Number.isFinite(expectedAmount) &&
    Math.abs(extractedAmount - expectedAmount) < 0.5;

  checks.push({
    name: "amountMatchesCoursePrice",
    passed: amountMatches,
    detail: amountMatches
      ? `Amount ${extractedAmount} matches course price ${expectedAmount}`
      : `Amount ${extractedAmount || "unreadable"} does not match course price ${expectedAmount}`,
  });

  if (!amountMatches) {
    reasons.push(
      `The amount on the screenshot does not match. The payment must be exactly ${expectedAmount} ${expectedCurrency || "EGP"} for this course.`
    );
  }

  const currencyMatches =
    !expectedCurrency ||
    !extracted?.currency ||
    String(extracted.currency).toUpperCase().includes(String(expectedCurrency).toUpperCase());

  checks.push({
    name: "currencyMatches",
    passed: currencyMatches,
    detail: currencyMatches ? "Currency matches" : `Currency mismatch (${extracted?.currency})`,
  });

  const extractedRecipient = normalizePhone(extracted?.recipientHandle);
  const expectedRecipient = normalizePhone(expectedRecipientHandle);
  const recipientMatches =
    !!expectedRecipient &&
    !!extractedRecipient &&
    (extractedRecipient === expectedRecipient ||
      extractedRecipient.endsWith(expectedRecipient) ||
      expectedRecipient.endsWith(extractedRecipient));

  checks.push({
    name: "recipientMatches",
    passed: recipientMatches,
    detail: recipientMatches
      ? `Recipient ${extractedRecipient} matches merchant handle`
      : `Recipient ${extractedRecipient || "unreadable"} does not match merchant handle ${expectedRecipient}`,
  });

  if (!recipientMatches) {
    reasons.push(
      `The recipient on the screenshot does not match the merchant handle. Money must be sent to ${expectedRecipientHandle}.`
    );
  }

  const requiredChecks = [
    "screenshotIsInstaPay",
    "amountMatchesCoursePrice",
    "recipientMatches",
  ];
  const allRequiredPassed = requiredChecks.every((name) =>
    checks.find((check) => check.name === name && check.passed)
  );

  let status;

  if (allRequiredPassed) {
    status = "verified";
  } else if (!isInstaPay) {
    status = "rejected";
  } else {
    status = "needs_review";
  }

  return {
    status,
    checks,
    reasons,
  };
}

async function verifyInstaPayScreenshot({
  screenshotBase64,
  screenshotMimeType,
  expectedAmount,
  expectedCurrency,
  expectedRecipientHandle,
  maxAgeMinutes = 180,
}) {
  const extracted = await extractScreenshotData({
    base64: screenshotBase64,
    mimeType: screenshotMimeType,
  });

  const verification = runVerificationChecks({
    extracted,
    expectedAmount,
    expectedCurrency,
    expectedRecipientHandle,
    maxAgeMinutes,
  });

  return {
    extracted,
    ...verification,
  };
}

module.exports = {
  verifyInstaPayScreenshot,
};
