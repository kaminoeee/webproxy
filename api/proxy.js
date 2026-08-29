export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  const url = new URL(request.url);
  const targetUrlStr = url.searchParams.get('url');

  // URLが指定されていない場合は、URL入力用のシンプルなHTMLフォームを返す
  if (!targetUrlStr) {
    const html = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Static Web Proxy</title>
    <style>
        body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f4f4f9; }
        .box { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); width: 100%; max-width: 500px; text-align: center; }
        input[type="url"] { width: 100%; padding: 0.75rem; font-size: 1rem; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; margin-bottom: 1rem; }
        button { background: #0070f3; color: white; border: none; padding: 0.75rem 1.5rem; font-size: 1rem; border-radius: 4px; cursor: pointer; width: 100%; }
        button:hover { background: #0051a2; }
    </style>
</head>
<body>
    <div class="box">
        <h2>Static Web Proxy</h2>
        <form method="GET" action="">
            <input type="url" name="url" placeholder="https://example.com" required>
            <button type="submit">サイトを表示</button>
        </form>
    </div>
</body>
</html>`;
    return new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  let targetUrl;
  try {
    targetUrl = new URL(targetUrlStr);
  } catch {
    return new Response('Invalid URL', { status: 400 });
  }

  if (targetUrl.protocol !== 'http:' && targetUrl.protocol !== 'https:') {
    return new Response('Only HTTP/HTTPS protocols are allowed', { status: 403 });
  }

  try {
    const headers = new Headers();
    if (request.headers.get('Accept')) {
      headers.set('Accept', request.headers.get('Accept'));
    }
    headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) VercelStaticProxy');

    const method = request.method === 'HEAD' ? 'HEAD' : 'GET';

    const modifiedRequest = new Request(targetUrl.toString(), {
      headers,
      method,
      redirect: 'follow'
    });

    const response = await fetch(modifiedRequest);

    const newResponse = new Response(response.body, response);
    newResponse.headers.set('Access-Control-Allow-Origin', '*');
    newResponse.headers.set('X-Content-Type-Options', 'nosniff');

    return newResponse;
  } catch (e) {
    return new Response(`Static Proxy Error: ${e.message}`, { status: 500 });
  }
}
