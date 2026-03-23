import axios from "axios";

const TELEGRAM_BOT_TOKEN = "8779220098:AAEt5mVf0CvVVnaE46aMMWCqh5rkKXPfV-0";
const TELEGRAM_CHAT_ID = "6159656800";
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

export async function sendTelegramMessage(text: string): Promise<boolean> {
  try {
    await axios.post(`${TELEGRAM_API}/sendMessage`, {
      chat_id: TELEGRAM_CHAT_ID,
      text,
      parse_mode: "HTML",
    });
    return true;
  } catch (err) {
    console.error("[Telegram] Failed to send message:", err);
    return false;
  }
}

export async function sendTelegramDocument(
  fileUrl: string,
  caption: string,
  filename: string
): Promise<{ success: boolean; messageId?: string }> {
  try {
    // Download file buffer then send as document
    const fileResponse = await axios.get(fileUrl, { responseType: "arraybuffer" });
    const buffer = Buffer.from(fileResponse.data);

    const FormData = (await import("form-data")).default;
    const form = new FormData();
    form.append("chat_id", TELEGRAM_CHAT_ID);
    form.append("caption", caption, { contentType: "text/plain" });
    form.append("document", buffer, { filename, contentType: fileResponse.headers["content-type"] || "application/octet-stream" });

    const response = await axios.post(`${TELEGRAM_API}/sendDocument`, form, {
      headers: form.getHeaders(),
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    const messageId = String(response.data?.result?.message_id || "");
    return { success: true, messageId };
  } catch (err) {
    console.error("[Telegram] Failed to send document:", err);
    // Fallback: send as link
    try {
      const fallbackText = `📁 <b>ملف جديد</b>\n${caption}\n\n🔗 <a href="${fileUrl}">تحميل الملف</a>`;
      const res = await axios.post(`${TELEGRAM_API}/sendMessage`, {
        chat_id: TELEGRAM_CHAT_ID,
        text: fallbackText,
        parse_mode: "HTML",
      });
      const messageId = String(res.data?.result?.message_id || "");
      return { success: true, messageId };
    } catch {
      return { success: false };
    }
  }
}

export async function notifyNewUser(username: string, maxServers: number, daysAllowed: number): Promise<void> {
  const text = `🆕 <b>حساب جديد تم إنشاؤه</b>\n\n👤 المستخدم: <code>${username}</code>\n🖥️ السيرفرات: ${maxServers}\n📅 الأيام: ${daysAllowed}\n⏰ ${new Date().toLocaleString("ar-SA")}`;
  await sendTelegramMessage(text);
}

export async function notifyFileUpload(username: string, filename: string, fileSize?: number): Promise<void> {
  const sizeStr = fileSize ? ` (${(fileSize / 1024 / 1024).toFixed(2)} MB)` : "";
  const text = `📤 <b>ملف جديد مرفوع</b>\n\n👤 المستخدم: <code>${username}</code>\n📄 الملف: <code>${filename}</code>${sizeStr}\n⏰ ${new Date().toLocaleString("ar-SA")}`;
  await sendTelegramMessage(text);
}

export async function notifyAccountExpiry(username: string, expiresAt: Date): Promise<void> {
  const text = `⚠️ <b>انتهت صلاحية حساب</b>\n\n👤 المستخدم: <code>${username}</code>\n📅 تاريخ الانتهاء: ${expiresAt.toLocaleDateString("ar-SA")}\n⏰ ${new Date().toLocaleString("ar-SA")}`;
  await sendTelegramMessage(text);
}
