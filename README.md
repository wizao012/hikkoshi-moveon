# MOVE ON LP — GitHub Pages公開用

このフォルダは、GitHub Pagesで公開し、Cloudflareで `hikkoshi-moveon.com` のDNSを管理する静的サイト一式です。

## 公開方法

1. GitHubで新しいリポジトリを作成します。
2. このフォルダの**中身すべて**をリポジトリ直下へアップロードします。
3. GitHubの Settings → Pages で、公開元を `main` / `/(root)` に設定します。
4. Custom domainへ `hikkoshi-moveon.com` を設定し、Cloudflare DNSをGitHub Pagesへ向けます。
5. DNSと証明書が有効になったら Enforce HTTPS をONにします。
6. 公開後に本番URLへアクセスし、画像・フォーム・モーダルを確認します。

`index.html` が必ずリポジトリ直下にある状態にしてください。

## フォーム送信について

`index.html` のフォームにはZapier Catch Hookの送信先を設定済みです。送信データはフォームエンコード形式で、受付番号・開通希望日・氏名・電話番号・任意メールアドレス・希望サービス・流入モード・広告流入パラメータ・参照元・送信ページURL・送信日時を送ります。住所はフォームでは取得せず、互換用の `address` 項目へ「電話でヒアリング」を送ります。

送信先を変更するときは、次の属性を新しいHTTPS URLへ変更してください。

```html
<form id="application-form" data-webhook-url="https://hooks.example.com/your-webhook/">
```

- 公開前にZapierでテストデータを1件受信し、項目マッピングを確認してください。
- Zapierが正常応答した場合だけ、フォームを明確な送信完了画面へ切り替えます。失敗時は入力内容を保持して再送できます。
- Webhook URLは静的HTMLから閲覧できるため、将来はCloudflare WorkerとSecretを使った中継への移行を推奨します。
- APIキーなどWebhook URL以外の秘密情報はHTML・JavaScriptへ記載しないでください。

## Google Tag Manager

全ページに `GTM-NSDBHPNR` を設置済みです。サイト側はWebhook成功後に `generate_lead`、電話リンクのクリック時に `click_to_call` を `dataLayer` へ送ります。

- GTM管理画面でGA4／Google Adsタグとカスタムイベントトリガーを作成し、コンテナを公開してください。
- フォームCVは `generate_lead` だけを利用し、GTMのフォーム送信トリガーと重複させないでください。
- Google Adsのコンバージョンリンカーは全ページで発火させてください。
- `power-company-contacts/` 内の電話クリックは、MOVE ONの有効リードCVから除外してください。

## 電話受付時間外の案内（2026-09-29）

MOVE ONの電話受付は毎日、日本時間10:00〜19:00です。10:00以上19:00未満は電話リンクで通常の発信画面へ進みます。時間外に電話リンクを押すと、営業時間とWEBフォームへのボタンを表示するモーダルが開きます。ページを開いたまま営業時間をまたいでも、クリック時点の時刻で判定します。

時刻はブラウザの時計を `Asia/Tokyo` で判定します。時間外のクリックは `phone_after_hours` として記録し、`click_to_call` は営業時間内のクリックでのみ記録します。時間外のモーダルからWEB申込み後に送信が成功した場合は、既存の `generate_lead` を記録します。

FV・本文・追従メニューの全8か所を確認済みです。地域電力会社一覧の連絡先は各社の窓口なので、この時間判定の対象外です。

## 検索・SNS設定

`canonical`、OG、Twitter Card、`robots.txt`、`sitemap.xml`、`CNAME` は `https://hikkoshi-moveon.com/` を正規URLとして設定済みです。正規URLを `www` に変更する場合は、これらをすべて同時に変更してください。

## ファイル構成

```text
index.html
styles.css
app.js
robots.txt
sitemap.xml
CNAME
favicon.ico
favicon-48x48.png
apple-touch-icon.png
icon-192.png
icon-512.png
icon-maskable-512.png
site.webmanifest
assets/
power-company-contacts/
  index.html
  styles.css
```

旧デザイン、参照画像、作業用バックアップは公開パッケージから除外しています。

表示用の写真・ロゴ・バナーはWebPへ最適化済みです。SNS共有画像は互換性を優先して `og-v3.jpg` を使用しています。

ファビコンとホーム画面アイコンは、承認済みMOVE ONロゴの「家＋電源」マークから作成しています。

Google広告のロゴアセットには次の最適化済みPNGを使用してください。どちらも重要部分を中央の安全領域へ配置し、150KB未満に圧縮しています。

- `assets/google-ads-logo-square-1200.png`：正方形ロゴ 1:1、1200×1200、約118KB
- `assets/google-ads-logo-landscape-1200x300.png`：横長ロゴ 4:1、1200×300、約47KB

`assets/moveon-icon-v1.png` と `assets/moveon-icon-v1-white.png` は高品質なロゴアイコンマスターとして保持しています。

`power-company-contacts/` は、地域電力会社10社の公式電話・WEB窓口をまとめた「その他のお問い合わせ」用ページです。電話番号や受付時間は変更される可能性があるため、定期的に各社公式ページと照合してください。
