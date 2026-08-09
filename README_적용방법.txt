적용 방법
1. 이 폴더 안의 index.html, manifest.webmanifest, service-worker.js, icons 폴더를 모두 GitHub Codespaces 저장소 최상단에 올립니다.
2. 기존 index.html은 index_backup.html로 이름을 바꿔 백업합니다.
3. 아래 명령어를 실행합니다.

   git add index.html manifest.webmanifest service-worker.js icons
   git commit -m "모바일 최적화와 앱 설치 기능 추가"
   git push

4. GitHub Pages 배포가 끝난 뒤 휴대전화에서 사이트를 엽니다.
5. 메뉴의 “홈 화면에 게임 설치” 버튼을 누릅니다.

참고: 전투 진입 시 가로 방향 잠금을 요청하고, 전투 밖에서는 세로 방향 잠금을 요청합니다. 기기나 브라우저가 방향 잠금을 허용하지 않는 경우에는 잘못된 방향에서 조작 화면을 차단하고 화면을 돌리라는 안내가 표시됩니다.
