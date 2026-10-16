# 🍱 양운 급식 봇 (Yangwoon Meal Bot)

부산 양운고등학교 학생들을 위한 실시간 스마트 급식 봇 & 식단 정보 웹 애플리케이션입니다.

- 🏫 **학교명**: 부산 양운고등학교
- 📡 **데이터 출처**: 교육부 나이스(NEIS) 오픈 API (학교코드: `7150115`, 교육청코드: `C10`)
- 🌐 **웹호스팅 (GitHub Pages)**: [https://hun0109.github.io/yangwoon-meal/](https://hun0109.github.io/yangwoon-meal/)

---

## 🌟 주요 기능

1. **🤖 대화형 양운 급식봇 (AI Chatbot)**
   - 오늘 점심/저녁, 내일 급식, 요일별 메뉴 질의응답
   - 이번 주 특식(치킨, 돈까스, 피자 등) 자동 감지 및 모아보기
   - 영양 성분(칼로리, 탄단지 비율) 및 19종 알레르기 유발 식품 안심 안내
2. **⏰ 실시간 급식 카운트다운**
   - 점심시간 및 석식 시간까지 남은 시간을 실시간으로 안내
3. **🛡️ 19종 알레르기 안심 필터**
   - 학생 본인의 알레르기 식품을 선택하면 메뉴에 실시간 강조 경고 태그 표시
4. **📊 영양 성분 분석 차트**
   - 탄수화물, 단백질, 지방 비율 시각화 프로그레스 바
5. **💬 실시간 급식 반응 (Supabase 연동)**
   - 전교생 실시간 반응 투표 (존맛 👍 / 보통 😐 / 별로 👎)
6. **📅 주간 식단표 한눈에 보기**
   - 이번 주 월~금 전체 식단표 즉시 확인

---

## 🚀 배포 및 호스팅 방법 (GitHub Pages)

1. GitHub에서 **`yangwoon-meal`** 이름으로 새 리포지토리(Public)를 생성합니다.
2. 코드를 커밋하고 `main` 브랜치에 푸시합니다:
   ```bash
   git init
   git branch -M main
   git remote add origin https://github.com/Hun0109/yangwoon-meal.git
   git add .
   git commit -m "feat: 부산 양운고등학교 나이스 API 급식 봇 생성"
   git push -u origin main
   ```
3. GitHub 리포지토리의 **Settings** -> **Pages** 로 이동합니다.
4. **Build and deployment** 항목의 Source를 `Deploy from a branch`로 선택하고, Branch를 `main` / `/(root)`로 지정한 뒤 **Save**를 누릅니다.
5. 몇 분 후 `https://hun0109.github.io/yangwoon-meal/` 주소로 전 세계 어디서나 접속할 수 있는 웹호스팅이 완료됩니다!
