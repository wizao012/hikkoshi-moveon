# MOVE ON LP — Cloudflare Pages公開用

このフォルダは、GitHubリポジトリとCloudflare Pagesを接続して公開する静的サイト一式です。

## 公開方法

1. GitHubで新しいリポジトリを作成します。
2. このフォルダの**中身すべて**をリポジトリ直下へアップロードします。
3. Cloudflare PagesでGitHubリポジトリを接続します。
4. Production branchを `main`、Build commandを `exit 0`、Build output directoryを `.` に設定します。
5. 公開後に表示されるURLへアクセスし、画像・フォーム・モーダルを確認します。

`index.html` が必ずリポジトリ直下にある状態にしてください。

## フォーム送信について

`index.html` のフォームにはZapier Catch Hookの送信先を設定済みです。送信データはフォームエンコード形式で、開通希望日・氏名・電話番号・住所・希望サービス・流入モード・送信ページURL・送信日時を送ります。

送信先を変更するときは、次の属性を新しいHTTPS URLへ変更してください。

```html
<form id="application-form" data-webhook-url="https://hooks.example.com/your-webhook/">
```

- 公開前にZapierでテストデータを1件受信し、項目マッピングを確認してください。
- Webhook URLは静的HTMLから閲覧できるため、将来はCloudflare Pages FunctionとSecretを使った中継への移行を推奨します。
- APIキーなどWebhook URL以外の秘密情報はHTML・JavaScriptへ記載しないでください。

## 公開URL確定後の推奨設定

SNS共有画像を正しく認識させるため、`index.html` の `og:image` を公開後の絶対HTTPS URLへ変更してください。必要に応じて `canonical` と `og:url` も追加します。

## ファイル構成

```text
index.html
styles.css
app.js
assets/
power-company-contacts/
  index.html
  styles.css
```

旧デザイン、参照画像、作業用バックアップは公開パッケージから除外しています。

`power-company-contacts/` は、地域電力会社10社の公式電話・WEB窓口をまとめた「その他のお問い合わせ」用ページです。電話番号や受付時間は変更される可能性があるため、定期的に各社公式ページと照合してください。
