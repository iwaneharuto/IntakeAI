// api/invite/send.js
// 招待メール送信 API
//
// 環境変数:
//   RESEND_API_KEY   = re_xxxx  (Resend.com の APIキー)
//   FROM_EMAIL       = noreply@lexoriaai.com (送信元アドレス)
//
// Resend未設定の場合は { ok: false, error: 'RESEND_API_KEY未設定' } を返す
// → フロント側でフォールバック（招待リンクをクリップボードコピー）

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { toEmail, toName, fromName, adminEmail, appUrl, inviteUrl } = req.body || {};

  // バリデーション
  if (!toEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail)) {
    return res.status(400).json({ error: 'メールアドレスの形式が正しくありません' });
  }
  if (!adminEmail) {
    return res.status(400).json({ error: '招待元情報が不足しています' });
  }

  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL || 'noreply@lexoriaai.com';

  if (!resendKey) {
    console.warn('[Invite] RESEND_API_KEY 未設定 - メール送信スキップ');
    return res.status(200).json({
      ok: false,
      error: 'メール送信が設定されていません（RESEND_API_KEY未設定）。招待リンクを直接共有してください。',
      inviteUrl,
    });
  }

  const html = `
<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"><title>Lexoria チーム招待</title></head>
<body style="font-family:'Helvetica Neue',Arial,sans-serif;background:#f5f0eb;padding:40px 20px;margin:0">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
    <div style="background:#1a1a2e;padding:28px 32px">
      <h1 style="color:#b8975a;font-size:1.5rem;margin:0;letter-spacing:.06em">Lexoria</h1>
    </div>
    <div style="padding:32px">
      <p style="font-size:1rem;color:#1a1a2e;margin-top:0">
        <strong>${toName || toEmail}</strong> さん、こんにちは。
      </p>
      <p style="color:#444;line-height:1.8">
        <strong>${fromName || adminEmail}</strong> さんからLexoriaチームへの招待が届いています。<br>
        以下のボタンからアカウントを作成してチームに参加してください。
      </p>
      <div style="text-align:center;margin:32px 0">
        <a href="${inviteUrl || appUrl}"
           style="display:inline-block;background:#b8975a;color:#fff;padding:14px 40px;border-radius:4px;text-decoration:none;font-weight:600;font-size:.95rem;letter-spacing:.04em">
          チームに参加する →
        </a>
      </div>
      <p style="font-size:.78rem;color:#999;line-height:1.7">
        このリンクの有効期限は7日間です。<br>
        招待に心当たりがない場合はこのメールを無視してください。
      </p>
    </div>
    <div style="background:#f5f0eb;padding:16px 32px;text-align:center">
      <p style="font-size:.72rem;color:#999;margin:0">
        © ${new Date().getFullYear()} Lexoria — support@lexoriaai.com
      </p>
    </div>
  </div>
</body>
</html>`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: `Lexoria <${fromEmail}>`,
        to:   [toEmail],
        subject: `【Lexoria】${fromName || adminEmail} さんからチームへの招待`,
        html,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[Invite] Resend APIエラー:', result);
      return res.status(200).json({
        ok: false,
        error: result.message || 'メール送信に失敗しました',
      });
    }

    console.log('[Invite] 送信成功:', toEmail, result.id);
    return res.status(200).json({ ok: true, id: result.id });

  } catch (err) {
    console.error('[Invite] 例外:', err);
    return res.status(500).json({ ok: false, error: 'サーバーエラーが発生しました: ' + err.message });
  }
}
