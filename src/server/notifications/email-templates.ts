import "server-only";

/**
 * Генерация HTML email-шаблонов для уведомлений.
 * Inline-стили для совместимости с почтовыми клиентами.
 */

function baseLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:24px 16px">
<tr><td align="center">
<table width="100%" style="max-width:480px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
<tr><td style="background:#1a1a2e;padding:20px 24px;text-align:center">
<span style="color:#fff;font-size:18px;font-weight:700;letter-spacing:-0.3px">ВкусМаркет</span>
</td></tr>
<tr><td style="padding:24px">
${content}
</td></tr>
<tr><td style="padding:16px 24px;border-top:1px solid #eee;text-align:center">
<span style="color:#999;font-size:12px">© ВкусМаркет · vkusmarket05.ru</span>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

export function orderNewHtml(opts: {
  title: string;
  body: string;
  url?: string;
}): string {
  const button = opts.url
    ? `<a href="${opts.url}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#1a1a2e;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px">Открыть заказ</a>`
    : "";
  return baseLayout(`
<h1 style="margin:0 0 8px;font-size:20px;color:#1a1a2e">${opts.title}</h1>
<p style="margin:0 0 16px;font-size:14px;color:#444;line-height:1.5">${opts.body}</p>
${button}
`);
}

export function orderStatusHtml(opts: {
  title: string;
  body: string;
  url?: string;
}): string {
  const button = opts.url
    ? `<a href="${opts.url}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#1a1a2e;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px">Подробнее</a>`
    : "";
  return baseLayout(`
<h1 style="margin:0 0 8px;font-size:18px;color:#1a1a2e">${opts.title}</h1>
<p style="margin:0 0 16px;font-size:14px;color:#444;line-height:1.5">${opts.body}</p>
${button}
`);
}

export function genericNotificationHtml(opts: {
  title: string;
  body: string;
  url?: string;
}): string {
  const button = opts.url
    ? `<a href="${opts.url}" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#1a1a2e;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px">Перейти</a>`
    : "";
  return baseLayout(`
<h1 style="margin:0 0 8px;font-size:18px;color:#1a1a2e">${opts.title}</h1>
<p style="margin:0;font-size:14px;color:#444;line-height:1.5">${opts.body}</p>
${button}
`);
}
