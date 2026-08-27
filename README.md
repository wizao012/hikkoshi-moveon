# MOVE ON LP — GitHub Pages公開用

このフォルダは、GitHub Pagesへそのまま配置できる静的サイト一式です。

## 公開方法

1. GitHubで新しいリポジトリを作成します。
2. このフォルダの**中身すべて**をリポジトリ直下へアップロードします。
3. リポジトリの GitHub Pages 設定で、公開元に `main` ブランチのルートを指定します。
4. 公開後に表示されるURLへアクセスし、画像・フォーム・モーダルを確認します。

`index.html` が必ずリポジトリ直下にある状態にしてください。

## フォーム送信について

現在、`index.html` のフォームにある `data-webhook-url` は空です。そのため入力確認までは動作しますが、外部へデータは送信しません。

Webhookを設定するときは、次の箇所へHTTPS URLを指定してください。

```html
<form id="application-form" data-webhook-url="https://example.com/webhook">
```

- Webhook側でGitHub Pagesの公開元ドメインをCORS許可してください。
- APIキーや秘密情報をHTML・JavaScriptへ直接記載しないでください。

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
