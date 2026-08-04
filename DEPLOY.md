# 배포 가이드 (VPS + GitHub Actions 자동 배포)

main에 push되면 GitHub Actions가 VPS에 SSH로 접속해 `git pull` + `docker compose up -d --build`를 실행한다.

## 1. VPS 최초 세팅 (한 번만)

```bash
# Docker 설치 (Ubuntu 기준)
curl -fsSL https://get.docker.com | sh

# 저장소 클론
git clone https://github.com/geeks-abc/GEEKs-t11-server.git ~/geeks-server
cd ~/geeks-server

# 운영 환경변수 작성
cat > .env <<'EOF'
DB_PASSWORD=강력한-비밀번호로-교체
DB_DATABASE=geeks
JWT_SECRET=긴-랜덤-문자열로-교체
EOF

# 첫 기동 + 시딩
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec app npm run seed
```

확인: `http://<VPS_IP>:3000/docs`

> 비공개 저장소라면 클론 전에 VPS에서 `gh auth login` 또는 deploy key 등록 필요.

## 2. 배포용 SSH 키 + GitHub Secrets (한 번만)

```bash
# (로컬 or VPS에서) 배포 전용 키 생성 — 비밀번호 없이
ssh-keygen -t ed25519 -f deploy_key -N "" -C "github-actions-deploy"

# 공개키를 VPS에 등록
cat deploy_key.pub >> ~/.ssh/authorized_keys
```

GitHub 저장소 → Settings → Secrets and variables → Actions에 등록:

| Secret | 값 |
|---|---|
| `VPS_HOST` | VPS IP 또는 도메인 |
| `VPS_USER` | SSH 사용자명 (예: ubuntu, root) |
| `VPS_SSH_KEY` | `deploy_key` **개인키** 파일 내용 전체 |
| `VPS_PORT` | (선택) SSH 포트, 기본 22 |

## 3. 이후 배포

main에 머지/푸시하면 자동 배포. Actions 탭 → "Deploy to VPS"에서 진행 상황 확인, `workflow_dispatch`로 수동 재배포도 가능.

## 운영 명령어 모음 (VPS에서)

```bash
cd ~/geeks-server

# 로그
docker compose -f docker-compose.prod.yml logs -f app

# 데모 데이터 리셋
docker compose -f docker-compose.prod.yml exec app npm run seed

# 재시작 / 전체 내리기
docker compose -f docker-compose.prod.yml restart app
docker compose -f docker-compose.prod.yml down
```

## 참고

- 업로드 사진(`ieum-uploads`)과 DB(`ieum-mysql-data`)는 도커 볼륨이라 재배포에도 유지된다.
- PDF 한글 폰트(`fonts-noto-cjk`)는 이미지에 포함돼 있다.
- 앱은 3000 포트로 노출된다. 도메인 + HTTPS가 필요하면 Caddy를 앞에 붙이는 게 가장 간단: `caddy reverse-proxy --from api.example.com --to localhost:3000`
