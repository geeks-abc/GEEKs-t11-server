# 이음 API 서버
# puppeteer(기부확인서 PDF)용 chromium + 한글 폰트 포함
FROM node:22-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends chromium fonts-noto-cjk \
  && rm -rf /var/lib/apt/lists/*

# 번들 chromium 다운로드 생략, 시스템 chromium 사용
ENV PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    NODE_ENV=production

WORKDIR /app

COPY package*.json ./
# devDependencies 포함 설치 (빌드 + 컨테이너 내 npm run seed 실행용)
RUN npm ci --include=dev

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["node", "dist/main.js"]
