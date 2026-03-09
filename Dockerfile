FROM node:25-alpine

RUN npm install -g @angular/cli
WORKDIR /app
# パッケージ定義を先にコピーしてインストール (キャッシュを効かせるため)
COPY package*.json ./
RUN npm install

# ソースコードをコピー (docker-composeのvolumesで上書きされるけど一応)
COPY . .

# Angularの開発サーバーのポート
EXPOSE 4200

# ホスト0.0.0.0で起動し、外部からアクセスできるようにする
CMD ["ng", "serve", "--host", "0.0.0.0", "--poll", "2000"]